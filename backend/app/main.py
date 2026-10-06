import secrets
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from math import ceil
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine, get_db
from .models import (
    Application,
    Approval,
    ApprovalDependency,
    ApprovalRule,
    AuditLog,
    ComplianceRecord,
    Department,
    Document,
    DocumentValidation,
    Inspection,
    Notification,
    Project,
    Query,
    User,
    now,
)
from .schemas import (
    ApplicationInput,
    AssistantInput,
    DecisionInput,
    InspectionInput,
    InspectionUpdate,
    LoginRequest,
    ProjectInput,
    QueryInput,
    Registration,
    ResponseInput,
    RiskInput,
    RuleUpdate,
)
from .seed import DOC_CATEGORIES, seed
from .services import (
    aiService,
    approvalService,
    complianceService,
    documentService,
    riskService,
    schemeService,
)

sessions: dict[str, str] = {}
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(title="NIRMAN Demonstration API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def current_user(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> User:
    token = (authorization or "").removeprefix("Bearer ")
    user = db.get(User, sessions.get(token, ""))
    if not user:
        raise HTTPException(401, "Please sign in to a demo account")
    return user


def require(user: User, *roles: str) -> None:
    if user.role not in roles:
        raise HTTPException(403, "This action requires an authorized role")


def get_project(db: Session, pid: str, user: User) -> Project:
    p = db.get(Project, pid)
    if not p:
        raise HTTPException(404, "Project not found")
    if user.role == "entrepreneur" and p.owner_id != user.id:
        raise HTTPException(403, "Project belongs to another applicant")
    return p


def get_application(db: Session, aid: str, user: User) -> Application:
    a = db.get(Application, aid)
    if not a:
        raise HTTPException(404, "Application not found")
    get_project(db, a.project_id, user)
    return a


def audit(db: Session, user: User, action: str, entity: str) -> None:
    db.add(
        AuditLog(
            id=str(uuid4()),
            user=user.name,
            role=user.role,
            action=action,
            entity=entity,
            result="Success",
        )
    )


def notify(db: Session, p: Project, title: str, text: str, link: str) -> None:
    db.add(
        Notification(
            id=str(uuid4()),
            user_id=p.owner_id,
            title=title,
            text=text,
            link=link,
            read=False,
        )
    )


def project_dict(p: Project, db: Session) -> dict[str, Any]:
    return {
        "id": p.id,
        "owner_id": p.owner_id,
        "name": p.name,
        "data": {k: v for k, v in p.data.items() if not k.startswith("_demo_")},
        "approval_statuses": p.data.get("_demo_approval_statuses", {}),
        "approval_ids": [a["id"] for a in approvalService.discover(db, p)],
        "created_at": p.created_at.isoformat(),
    }


def application_dict(db: Session, a: Application) -> dict:
    approval = db.get(Approval, a.approval_id)
    p = db.get(Project, a.project_id)
    dep = db.get(Department, approval.department_id)
    submitted = (
        a.submitted_at.replace(tzinfo=timezone.utc)
        if a.submitted_at.tzinfo is None
        else a.submitted_at
    )
    due = submitted + timedelta(days=approval.sla)
    remaining = max(0, ceil((due - now()).total_seconds() / 86400))
    return {
        "sla_remaining": remaining,
        "sla_due": due.isoformat(),
        "id": a.id,
        "project_id": a.project_id,
        "approval_id": a.approval_id,
        "approval": approval.name,
        "department": dep.short,
        "company": p.data["company"],
        "project": p.name,
        "industry": p.data["sub_sector"],
        "status": a.status,
        "sla": approval.sla,
        "submitted_at": a.submitted_at.isoformat(),
        "history": a.history,
        "risk": riskService.analyze(db, p),
        "officer": "Anjali Deshmukh",
    }


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "mode": "demonstration"}


@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    u = db.scalar(select(User).where(User.email == payload.email.lower().strip()))
    if not u:
        raise HTTPException(401, "Use a demo account or register as an applicant")
    token = secrets.token_urlsafe(32)
    sessions[token] = u.id
    return {
        "token": token,
        "user": {"id": u.id, "name": u.name, "email": u.email, "role": u.role},
    }


@app.post("/api/auth/register")
def register(payload: Registration, db: Session = Depends(get_db)) -> dict[str, Any]:
    if "@" not in payload.email:
        raise HTTPException(422, "Enter a valid email address")
    if db.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(409, "Email already registered")
    u = User(
        id=str(uuid4()),
        name=payload.name,
        email=payload.email.lower(),
        role="entrepreneur",
    )
    db.add(u)
    db.flush()
    audit(db, u, "Applicant Registered", u.id)
    db.commit()
    return login(LoginRequest(email=u.email), db)


@app.get("/api/projects")
def projects(
    db: Session = Depends(get_db), user: User = Depends(current_user)
) -> list[dict[str, Any]]:
    q = select(Project).order_by(Project.created_at.desc())
    if user.role == "entrepreneur":
        q = q.where(Project.owner_id == user.id)
    return [project_dict(p, db) for p in db.scalars(q)]


@app.post("/api/projects", status_code=201)
def create_project(
    payload: ProjectInput,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict[str, Any]:
    require(user, "entrepreneur")
    p = Project(id=str(uuid4()), owner_id=user.id, name=payload.name, data=payload.model_dump())
    db.add(p)
    db.flush()
    audit(db, user, "Project Created", p.id)
    db.commit()
    return project_dict(p, db)


@app.get("/api/projects/{pid}")
def project(
    pid: str, db: Session = Depends(get_db), user: User = Depends(current_user)
) -> dict[str, Any]:
    return project_dict(get_project(db, pid, user), db)


@app.post("/api/projects/{pid}/discover-approvals")
def discover(
    pid: str, db: Session = Depends(get_db), user: User = Depends(current_user)
) -> dict[str, Any]:
    p = get_project(db, pid, user)
    result = approvalService.discover(db, p)
    audit(db, user, "Approval Discovered", pid)
    db.commit()
    dependencies = [
        {"source": d.source_id, "target": d.target_id}
        for d in db.scalars(select(ApprovalDependency))
    ]
    ids = {a["id"] for a in result}
    dependencies = [d for d in dependencies if d["source"] in ids and d["target"] in ids]
    durations = {a["id"]: a["sla"] for a in result}

    def completion(aid: str) -> int:
        predecessors = [d["source"] for d in dependencies if d["target"] == aid]
        return durations[aid] + max((completion(i) for i in predecessors), default=0)

    critical = max((completion(i) for i in ids), default=0)
    parallel = sum(d["source"] == "a1" for d in dependencies)
    return {
        "approvals": result,
        "dependencies": dependencies,
        "critical_path_days": critical,
        "parallelizable": parallel,
    }


@app.get("/api/approvals")
def approvals(
    db: Session = Depends(get_db), user: User = Depends(current_user)
) -> list[dict[str, Any]]:
    return [
        {
            "id": a.id,
            "name": a.name,
            "department_id": a.department_id,
            "priority": a.priority,
            "sla": a.sla,
            "description": a.description,
        }
        for a in db.scalars(select(Approval))
    ]


@app.get("/api/approvals/{aid}")
def approval(
    aid: str, db: Session = Depends(get_db), user: User = Depends(current_user)
) -> dict[str, Any]:
    a = db.get(Approval, aid)
    if not a:
        raise HTTPException(404, "Approval not found")
    return {
        "id": a.id,
        "name": a.name,
        "department_id": a.department_id,
        "priority": a.priority,
        "sla": a.sla,
        "description": a.description,
        "required_documents": DOC_CATEGORIES,
    }


@app.get("/api/documents")
def documents(
    project_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)
) -> list[dict[str, Any]]:
    get_project(db, project_id, user)
    return [
        {
            "id": d.id,
            "name": d.name,
            "category": d.category,
            "status": d.status,
            "uploaded_at": d.uploaded_at.isoformat(),
            "validation": (
                v.result
                if (
                    v := db.scalar(
                        select(DocumentValidation).where(DocumentValidation.document_id == d.id)
                    )
                )
                else None
            ),
        }
        for d in db.scalars(select(Document).where(Document.project_id == project_id))
    ]


@app.post("/api/documents/upload", status_code=201)
async def upload(
    project_id: str = Form(...),
    category: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict[str, Any]:
    require(user, "entrepreneur")
    get_project(db, project_id, user)
    if category not in DOC_CATEGORIES:
        raise HTTPException(422, "Choose a required document category")
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in [".pdf", ".png", ".jpg", ".jpeg"]:
        raise HTTPException(422, "Upload PDF, PNG or JPG")
    content = await file.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, "Maximum file size is 10 MB")
    if not content:
        raise HTTPException(422, "File is empty")
    did = str(uuid4())
    path = UPLOAD_DIR / f"{did}{suffix}"
    path.write_bytes(content)
    d = Document(
        id=did,
        project_id=project_id,
        name=Path(file.filename).name,
        category=category,
        status="Uploaded",
        path=str(path),
    )
    db.add(d)
    audit(db, user, "Document Uploaded", did)
    db.commit()
    return {"id": did, "name": d.name, "category": category, "status": d.status}


@app.post("/api/documents/{did}/validate")
def validate(
    did: str, db: Session = Depends(get_db), user: User = Depends(current_user)
) -> dict[str, Any]:
    d = db.get(Document, did)
    if not d:
        raise HTTPException(404, "Document not found")
    p = get_project(db, d.project_id, user)
    result = documentService.validate(d, p)
    v = db.scalar(select(DocumentValidation).where(DocumentValidation.document_id == did))
    if v:
        v.result = result
    else:
        db.add(DocumentValidation(id=str(uuid4()), document_id=did, result=result))
    d.status = "Warning" if result["warning"] else "Verified"
    audit(db, user, "AI Validation Completed", did)
    db.commit()
    return result


@app.get("/api/applications")
def applications(
    db: Session = Depends(get_db), user: User = Depends(current_user)
) -> list[dict[str, Any]]:
    q = select(Application).order_by(Application.submitted_at.desc())
    if user.role == "entrepreneur":
        q = q.join(Project).where(Project.owner_id == user.id)
    return [application_dict(db, a) for a in db.scalars(q)]


@app.post("/api/applications", status_code=201)
def submit(
    payload: ApplicationInput,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict[str, Any]:
    require(user, "entrepreneur")
    p = get_project(db, payload.project_id, user)
    allowed = {a["id"] for a in approvalService.discover(db, p)}
    if payload.approval_id not in allowed:
        raise HTTPException(422, "Approval does not match project rules")
    if not db.scalar(select(Document).where(Document.project_id == p.id)):
        raise HTTPException(
            422,
            "Upload at least one document before submitting the demonstration application",
        )
    existing = db.scalar(
        select(Application).where(
            Application.project_id == p.id,
            Application.approval_id == payload.approval_id,
        )
    )
    if existing:
        raise HTTPException(409, "An application for this approval already exists")
    a = Application(
        id=f"NIR-2026-{str(uuid4())[:8].upper()}",
        project_id=p.id,
        approval_id=payload.approval_id,
        status="Under Review",
        officer_id="o1",
        history=[
            {
                "action": "Application Submitted",
                "date": now().isoformat(),
                "comment": "Demo submission; no government system contacted",
            }
        ],
    )
    db.add(a)
    db.flush()
    audit(db, user, "Application Submitted", a.id)
    db.commit()
    return application_dict(db, a)


@app.get("/api/applications/{aid}")
def application(
    aid: str, db: Session = Depends(get_db), user: User = Depends(current_user)
) -> dict[str, Any]:
    a = get_application(db, aid, user)
    entity_ids = {
        aid,
        a.project_id,
        *[d.id for d in db.scalars(select(Document).where(Document.project_id == a.project_id))],
    }
    trail = [
        {
            "action": entry.action,
            "user": entry.user,
            "role": entry.role,
            "timestamp": entry.timestamp.isoformat(),
            "result": entry.result,
        }
        for entry in db.scalars(
            select(AuditLog)
            .where(AuditLog.entity.in_(entity_ids))
            .order_by(AuditLog.timestamp.desc())
        )
    ]
    return {
        "audit_trail": trail,
        **application_dict(db, a),
        "project_data": db.get(Project, a.project_id).data,
        "documents": documents(a.project_id, db, user),
        "queries": [
            {
                "id": q.id,
                "text": q.text,
                "status": q.status,
                "response": q.response,
                "due_date": q.due_date,
            }
            for q in db.scalars(select(Query).where(Query.application_id == aid))
        ],
        "inspections": [
            {
                "id": i.id,
                "date": i.date,
                "inspector": i.inspector,
                "status": i.status,
                "report": i.report,
            }
            for i in db.scalars(select(Inspection).where(Inspection.application_id == aid))
        ],
    }


@app.post("/api/applications/{aid}/query")
def raise_query(
    aid: str,
    payload: QueryInput,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict[str, Any]:
    require(user, "officer")
    a = get_application(db, aid, user)
    if a.status in ["Approved", "Rejected"]:
        raise HTTPException(409, "A decided application cannot be queried")
    q = Query(
        id=str(uuid4()),
        application_id=aid,
        text=payload.text,
        status="Query Raised",
        response=None,
        due_date=(now() + timedelta(days=7)).date().isoformat(),
    )
    db.add(q)
    a.status = "Action Required"
    a.history = [
        *a.history,
        {"action": "Query Raised", "date": now().isoformat(), "comment": payload.text},
    ]
    notify(
        db,
        db.get(Project, a.project_id),
        "Clarification requested",
        payload.text,
        f"/app/applications/{aid}",
    )
    audit(db, user, "Query Raised", aid)
    db.commit()
    return {"id": q.id, "status": q.status}


@app.post("/api/queries/{qid}/respond")
def respond(
    qid: str,
    payload: ResponseInput,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict[str, Any]:
    require(user, "entrepreneur")
    q = db.get(Query, qid)
    if not q:
        raise HTTPException(404, "Query not found")
    a = get_application(db, q.application_id, user)
    d = db.get(Document, payload.document_id)
    if not d or d.project_id != a.project_id:
        raise HTTPException(422, "Attach a document from this project")
    if q.status != "Query Raised":
        raise HTTPException(409, "Query already answered")
    q.response = payload.response + f" [Document: {d.name}]"
    q.status = "Applicant Responded"
    a.status = "Under Review"
    a.history = [
        *a.history,
        {
            "action": "Applicant Responded",
            "date": now().isoformat(),
            "comment": q.response,
        },
    ]
    audit(db, user, "Query Responded", q.id)
    db.commit()
    return {"status": q.status}


@app.post("/api/applications/{aid}/inspection")
def schedule(
    aid: str,
    payload: InspectionInput,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict[str, Any]:
    require(user, "officer")
    a = get_application(db, aid, user)
    if a.status in ["Approved", "Rejected"]:
        raise HTTPException(409, "A decided application cannot be scheduled")
    try:
        datetime.fromisoformat(payload.date)
    except ValueError:
        raise HTTPException(422, "Invalid inspection date")
    i = Inspection(
        id=str(uuid4()),
        application_id=aid,
        date=payload.date,
        inspector=payload.inspector,
        status="Scheduled",
        report=None,
    )
    db.add(i)
    a.status = "Inspection Scheduled"
    a.history = [
        *a.history,
        {
            "action": "Inspection Scheduled",
            "date": now().isoformat(),
            "comment": payload.date + " · " + payload.inspector,
        },
    ]
    notify(
        db,
        db.get(Project, a.project_id),
        "Inspection scheduled",
        f"Site visit on {payload.date}",
        f"/app/applications/{aid}",
    )
    audit(db, user, "Inspection Scheduled", aid)
    db.commit()
    return {"id": i.id, "status": i.status}


@app.post("/api/applications/{aid}/decision")
def decision(
    aid: str,
    payload: DecisionInput,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict[str, Any]:
    require(user, "officer")
    a = get_application(db, aid, user)
    if a.status in ["Approved", "Rejected"]:
        raise HTTPException(409, "Decision already recorded")
    open_queries = list(
        db.scalars(select(Query).where(Query.application_id == aid, Query.status == "Query Raised"))
    )
    pending = list(
        db.scalars(
            select(Inspection).where(
                Inspection.application_id == aid, Inspection.status != "Completed"
            )
        )
    )
    if payload.decision == "Approved" and (open_queries or pending):
        raise HTTPException(
            409,
            "Resolve outstanding queries and complete scheduled inspections before approval",
        )
    a.status = payload.decision
    a.history = [
        *a.history,
        {
            "action": payload.decision,
            "date": now().isoformat(),
            "comment": f"Human decision by {user.name}: {payload.comment}",
        },
    ]
    for q in db.scalars(
        select(Query).where(Query.application_id == aid, Query.status == "Applicant Responded")
    ):
        q.status = "Officer Reviewed"
    if payload.decision == "Approved":
        ap = db.get(Approval, a.approval_id)
        db.add(
            ComplianceRecord(
                id=str(uuid4()),
                project_id=a.project_id,
                application_id=aid,
                name=ap.name + " Renewal",
                due_date=(now() + timedelta(days=365)).date().isoformat(),
                status="Active",
            )
        )
    notify(
        db,
        db.get(Project, a.project_id),
        "Application " + payload.decision,
        payload.comment,
        f"/app/applications/{aid}",
    )
    audit(db, user, "Decision Recorded", aid)
    db.commit()
    return application_dict(db, a)


@app.get("/api/inspections")
def inspections(
    db: Session = Depends(get_db), user: User = Depends(current_user)
) -> list[dict[str, Any]]:
    require(user, "officer", "admin")
    return [
        {
            "id": i.id,
            "application_id": i.application_id,
            "date": i.date,
            "inspector": i.inspector,
            "status": i.status,
            "report": i.report,
            "location": db.get(Project, db.get(Application, i.application_id).project_id).data[
                "address"
            ],
        }
        for i in db.scalars(select(Inspection))
    ]


@app.patch("/api/inspections/{iid}")
def update_inspection(
    iid: str,
    payload: InspectionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict[str, Any]:
    require(user, "officer")
    i = db.get(Inspection, iid)
    if not i:
        raise HTTPException(404, "Inspection not found")
    a = get_application(db, i.application_id, user)
    if a.status in ["Approved", "Rejected"]:
        raise HTTPException(409, "A decided application cannot have its inspection changed")
    if payload.status == "Completed" and not (payload.report or i.report):
        raise HTTPException(422, "An inspection report is required")
    if payload.date:
        try:
            datetime.fromisoformat(payload.date)
        except ValueError:
            raise HTTPException(422, "Invalid date")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(i, k, v)
    label = "Inspection Completed" if payload.status == "Completed" else "Inspection Rescheduled"
    a.history = [
        *a.history,
        {
            "action": label,
            "date": now().isoformat(),
            "comment": payload.report or i.date,
        },
    ]
    if payload.status == "Completed":
        a.status = "Technical Review"
    notify(
        db,
        db.get(Project, a.project_id),
        label,
        payload.report or f"Site visit moved to {i.date}",
        f"/app/applications/{a.id}",
    )
    audit(db, user, "Inspection Updated", iid)
    db.commit()
    return {"status": i.status}


@app.get("/api/queries")
def queries(
    db: Session = Depends(get_db), user: User = Depends(current_user)
) -> list[dict[str, Any]]:
    q = select(Query)
    if user.role == "entrepreneur":
        q = q.join(Application).join(Project).where(Project.owner_id == user.id)
    return [
        {
            "id": x.id,
            "application_id": x.application_id,
            "text": x.text,
            "status": x.status,
            "response": x.response,
            "due_date": x.due_date,
        }
        for x in db.scalars(q)
    ]


@app.get("/api/compliance")
def compliance(
    project_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)
) -> dict[str, Any]:
    get_project(db, project_id, user)
    records = list(
        db.scalars(select(ComplianceRecord).where(ComplianceRecord.project_id == project_id))
    )
    return {
        "score": complianceService.score(records),
        "records": [
            {"id": r.id, "name": r.name, "due_date": r.due_date, "status": r.status}
            for r in records
        ],
    }


@app.get("/api/schemes")
def schemes(
    project_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)
) -> list[dict[str, Any]]:
    return schemeService.recommend(db, get_project(db, project_id, user))


@app.get("/api/notifications")
def notifications(
    db: Session = Depends(get_db), user: User = Depends(current_user)
) -> list[dict[str, Any]]:
    return [
        {"id": n.id, "title": n.title, "text": n.text, "read": n.read, "link": n.link}
        for n in db.scalars(select(Notification).where(Notification.user_id == user.id))
    ]


@app.patch("/api/notifications/{nid}")
def read_notification(
    nid: str, db: Session = Depends(get_db), user: User = Depends(current_user)
) -> dict[str, Any]:
    n = db.get(Notification, nid)
    if not n or n.user_id != user.id:
        raise HTTPException(404, "Notification not found")
    n.read = True
    db.commit()
    return {"read": True}


@app.post("/api/ai/regulatory-assistant")
def assistant(
    payload: AssistantInput,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict[str, Any]:
    return aiService.answer(db, payload.question, get_project(db, payload.project_id, user))


@app.post("/api/ai/risk-analysis")
def risk(
    payload: RiskInput,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict[str, Any]:
    return riskService.analyze(db, get_project(db, payload.project_id, user))


@app.get("/api/officer/dashboard")
def officer_dashboard(
    db: Session = Depends(get_db), user: User = Depends(current_user)
) -> dict[str, Any]:
    require(user, "officer", "admin")
    apps = list(db.scalars(select(Application)))
    return {
        "received": len(apps),
        "pending": sum(a.status not in ["Approved", "Rejected"] for a in apps),
        "sla_at_risk": 2,
        "high_risk": sum(
            riskService.analyze(db, db.get(Project, a.project_id))["level"] == "High" for a in apps
        ),
        "inspections": len(
            list(db.scalars(select(Inspection).where(Inspection.status == "Scheduled")))
        ),
        "average_days": 8.4,
    }


@app.get("/api/admin/rules")
def rules(
    db: Session = Depends(get_db), user: User = Depends(current_user)
) -> list[dict[str, Any]]:
    require(user, "admin")
    return [
        {
            "id": r.id,
            "name": r.name,
            "conditions": r.conditions,
            "approval_ids": r.approval_ids,
            "enabled": r.enabled,
        }
        for r in db.scalars(select(ApprovalRule))
    ]


@app.patch("/api/admin/rules/{rid}")
def update_rule(
    rid: str,
    payload: RuleUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict[str, Any]:
    require(user, "admin")
    r = db.get(ApprovalRule, rid)
    if not r:
        raise HTTPException(404, "Rule not found")
    r.enabled = payload.enabled
    audit(db, user, "Rule Updated", rid)
    db.commit()
    return {"enabled": r.enabled}


@app.get("/api/departments")
def departments(
    db: Session = Depends(get_db), user: User = Depends(current_user)
) -> list[dict[str, Any]]:
    return [{"id": d.id, "name": d.name, "short": d.short} for d in db.scalars(select(Department))]


@app.get("/api/admin/audit-logs")
def logs(db: Session = Depends(get_db), user: User = Depends(current_user)) -> list[dict[str, Any]]:
    require(user, "admin", "officer")
    return [
        {
            "id": entry.id,
            "timestamp": entry.timestamp.isoformat(),
            "user": entry.user,
            "role": entry.role,
            "action": entry.action,
            "entity": entry.entity,
            "result": entry.result,
        }
        for entry in db.scalars(select(AuditLog).order_by(AuditLog.timestamp.desc()))
    ]


@app.get("/api/admin/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db), user: User = Depends(current_user)
) -> dict[str, Any]:
    require(user, "admin")
    return {
        "users": len(list(db.scalars(select(User)))),
        "projects": len(list(db.scalars(select(Project)))),
        "departments": 5,
        "approvals": 12,
        "rules": len(list(db.scalars(select(ApprovalRule)))),
        "events": len(list(db.scalars(select(AuditLog)))),
    }
