from sqlalchemy import select
from app.models import (
    Document,
    Project,
    User,
    Approval,
    Application,
    AuditLog,
    ComplianceRecord,
    Scheme,
)
from app.seed import DOC_CATEGORIES
from app import main

PROFILE = {
    "name": "Judging Manufacturing Unit",
    "company": "Bharat Chemicals Pvt Ltd",
    "applicant": "Aditya Sharma",
    "contact": "aditya@example.in",
    "investment": 15,
    "employees": 120,
    "land": 4.2,
    "address": "Plot 12, Chakan MIDC, Pune",
    "pin": "410501",
    "hazardous": True,
}


def upload(client, headers, pid, category="Project Report"):
    r = client.post(
        "/api/documents/upload",
        headers=headers,
        data={"project_id": pid, "category": category},
        files={
            "file": (
                category.replace(" ", "_") + ".pdf",
                b"%PDF-1.4\nDemonstration report",
                "application/pdf",
            )
        },
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_complete_judging_journey(client, applicant, officer, admin):
    p = client.post("/api/projects", headers=applicant, json=PROFILE)
    assert p.status_code == 201, p.text
    pid = p.json()["id"]
    discovery = client.post(f"/api/projects/{pid}/discover-approvals", headers=applicant).json()
    assert len(discovery["approvals"]) == 12 and discovery["critical_path_days"] == 42
    did = upload(client, applicant, pid)
    analysis = client.post(f"/api/documents/{did}/validate", headers=applicant).json()
    assert analysis["score"] == 92 and analysis["warning"]
    assert next(c for c in analysis["checks"] if c["field"] == "employees") == {
        "field": "employees",
        "matches": False,
        "profile": 120,
        "extracted": 100,
    }
    submitted = client.post(
        "/api/applications",
        headers=applicant,
        json={"project_id": pid, "approval_id": "a2"},
    )
    assert submitted.status_code == 201, submitted.text
    aid = submitted.json()["id"]
    review = client.get(f"/api/applications/{aid}", headers=officer).json()
    assert review["company"] == PROFILE["company"]
    assert review["risk"]["score"] == sum(f["points"] for f in review["risk"]["factors"])
    assert "Human decision required" in review["risk"]["disclaimer"]
    assert review["documents"][0]["validation"]["warning"]
    q = client.post(
        f"/api/applications/{aid}/query",
        headers=officer,
        json={"text": "Please upload the updated environmental report."},
    )
    assert q.status_code == 200
    decision = {
        "decision": "Approved",
        "comment": "Reviewed and inspected by the human officer.",
    }
    assert (
        client.post(f"/api/applications/{aid}/decision", headers=officer, json=decision).status_code
        == 409
    )
    assert any(
        n["title"] == "Clarification requested" and aid in n["link"]
        for n in client.get("/api/notifications", headers=applicant).json()
    )
    env = upload(client, applicant, pid, "Environmental Report")
    r = client.post(
        f"/api/queries/{q.json()['id']}/respond",
        headers=applicant,
        json={"response": "Updated report attached for review.", "document_id": env},
    )
    assert r.status_code == 200 and r.json()["status"] == "Applicant Responded"
    i = client.post(
        f"/api/applications/{aid}/inspection",
        headers=officer,
        json={"date": "2026-10-15", "inspector": "Anjali Deshmukh"},
    )
    assert i.status_code == 200
    assert (
        client.post(f"/api/applications/{aid}/decision", headers=officer, json=decision).status_code
        == 409
    )
    assert (
        client.patch(
            f"/api/inspections/{i.json()['id']}",
            headers=officer,
            json={
                "status": "Completed",
                "report": "Site inspected. Safety provisions verified.",
            },
        ).status_code
        == 200
    )
    assert (
        client.post(f"/api/applications/{aid}/decision", headers=officer, json=decision).status_code
        == 200
    )
    assert client.get(f"/api/applications/{aid}", headers=applicant).json()["status"] == "Approved"
    assert (
        client.patch(
            f"/api/inspections/{i.json()['id']}",
            headers=officer,
            json={
                "status": "Completed",
                "report": "An amended report cannot reopen a final decision.",
            },
        ).status_code
        == 409
    )
    assert client.get(f"/api/applications/{aid}", headers=applicant).json()["status"] == "Approved"
    c = client.get(f"/api/compliance?project_id={pid}", headers=applicant).json()
    assert any(r["name"] == "Pollution Control Consent Renewal" for r in c["records"])
    assert len(client.get(f"/api/schemes?project_id={pid}", headers=applicant).json()) == 5
    actions = {e["action"] for e in client.get("/api/admin/audit-logs", headers=admin).json()}
    assert {
        "Project Created",
        "Approval Discovered",
        "Document Uploaded",
        "AI Validation Completed",
        "Application Submitted",
        "Query Raised",
        "Query Responded",
        "Inspection Scheduled",
        "Inspection Updated",
        "Decision Recorded",
    } <= actions


def test_rule_changes_affect_discovery(client, applicant, admin):
    assert (
        len(
            client.post("/api/projects/p1/discover-approvals", headers=applicant).json()[
                "approvals"
            ]
        )
        == 12
    )
    assert (
        client.patch("/api/admin/rules/r4", headers=admin, json={"enabled": False}).status_code
        == 200
    )
    assert "a11" not in {
        a["id"]
        for a in client.post("/api/projects/p1/discover-approvals", headers=applicant).json()[
            "approvals"
        ]
    }
    pid = client.post(
        "/api/projects",
        headers=applicant,
        json={
            **PROFILE,
            "state": "Gujarat",
            "industry": "Services",
            "hazardous": False,
            "investment": 2,
        },
    ).json()["id"]
    assert (
        client.post(f"/api/projects/{pid}/discover-approvals", headers=applicant).json()[
            "approvals"
        ]
        == []
    )


def test_role_and_ownership_boundaries(client, applicant, officer):
    assert client.get("/api/projects").status_code == 401
    assert client.get("/api/admin/rules", headers=applicant).status_code == 403
    assert (
        client.post(
            "/api/applications/NIR-2026-00422/decision",
            headers=applicant,
            json={"decision": "Approved", "comment": "I approve myself"},
        ).status_code
        == 403
    )
    assert client.get("/api/projects/p4", headers=applicant).status_code == 403
    assert client.post("/api/projects", headers=officer, json=PROFILE).status_code == 403
    assert client.get("/api/documents?project_id=p4", headers=applicant).status_code == 403


def test_upload_and_input_validation(client, applicant):
    assert (
        client.post(
            "/api/projects", headers=applicant, json={**PROFILE, "employees": -1}
        ).status_code
        == 422
    )
    assert (
        client.post("/api/projects", headers=applicant, json={**PROFILE, "pin": "abc"}).status_code
        == 422
    )
    for name, body, expected in [
        ("run.exe", b"bad", 422),
        ("empty.pdf", b"", 422),
        ("big.pdf", b"x" * (10 * 1024 * 1024 + 1), 413),
    ]:
        assert (
            client.post(
                "/api/documents/upload",
                headers=applicant,
                data={"project_id": "p1", "category": "PAN"},
                files={"file": (name, body, "application/pdf")},
            ).status_code
            == expected
        )


def test_duplicate_and_decided_guards(client, applicant, officer):
    assert (
        client.post(
            "/api/applications",
            headers=applicant,
            json={"project_id": "p1", "approval_id": "a2"},
        ).status_code
        == 409
    )
    assert (
        client.post(
            "/api/applications/NIR-2026-00421/decision",
            headers=officer,
            json={"decision": "Rejected", "comment": "Changed my mind"},
        ).status_code
        == 409
    )
    assert (
        client.post(
            "/api/applications/NIR-2026-00421/query",
            headers=officer,
            json={"text": "Please send more documents"},
        ).status_code
        == 409
    )
    assert (
        client.post(
            "/api/applications/NIR-2026-00421/inspection",
            headers=officer,
            json={"date": "2026-10-15", "inspector": "Anjali Deshmukh"},
        ).status_code
        == 409
    )


def test_risk_engine_complete_expired_and_history(client, applicant):
    pid = client.post(
        "/api/projects",
        headers=applicant,
        json={**PROFILE, "hazardous": False, "employees": 100},
    ).json()["id"]
    for category in DOC_CATEGORIES:
        did = upload(client, applicant, pid, category)
        assert (
            client.post(f"/api/documents/{did}/validate", headers=applicant).json()["score"] == 100
        )
    r = client.post("/api/ai/risk-analysis", headers=applicant, json={"project_id": pid}).json()
    assert (
        r["score"] == 0
        and r["level"] == "Low"
        and r["recommendation"] == "Proceed to technical review."
    )
    with main.SessionLocal() as db:
        d = db.scalar(select(Document).where(Document.project_id == pid))
        d.status = "Expired"
        p = db.get(Project, pid)
        p.data = {**p.data, "previous_compliance_issue": True}
        db.commit()
    assert (
        client.post("/api/ai/risk-analysis", headers=applicant, json={"project_id": pid}).json()[
            "score"
        ]
        == 15
    )


def test_assistant_grounding(client, applicant, monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    for question in [
        "What approvals are required?",
        "Why Pollution Control Consent?",
        "What documents are missing?",
        "Which approvals can run in parallel?",
    ]:
        r = client.post(
            "/api/ai/regulatory-assistant",
            headers=applicant,
            json={"question": question, "project_id": "p1"},
        )
        assert r.status_code == 200
        assert all(r.json()[k] for k in ["answer", "source", "rule", "explanation"])
        assert r.json()["demo"] is True and r.json()["provider"] == "Deterministic demo assistant"


def test_registration(client):
    r = client.post(
        "/api/auth/register",
        json={"name": "Judging Applicant", "email": "judge@example.in"},
    )
    assert r.status_code == 200 and r.json()["user"]["role"] == "entrepreneur"
    assert (
        client.post(
            "/api/auth/register",
            json={"name": "Judging Applicant", "email": "judge@example.in"},
        ).status_code
        == 409
    )
    assert client.post("/api/auth/login", json={"email": "unknown@example.in"}).status_code == 401


def test_seed_counts(client):
    with main.SessionLocal() as db:
        counts = {
            m.__name__: len(list(db.scalars(select(m))))
            for m in [
                User,
                Project,
                Approval,
                Document,
                Application,
                ComplianceRecord,
                Scheme,
                AuditLog,
            ]
        }
    assert counts == {
        "User": 9,
        "Project": 5,
        "Approval": 12,
        "Document": 20,
        "Application": 8,
        "ComplianceRecord": 10,
        "Scheme": 5,
        "AuditLog": 20,
    }


def test_inspection_report_and_reschedule(client, officer):
    assert (
        client.patch(
            "/api/inspections/i1", headers=officer, json={"status": "Completed"}
        ).status_code
        == 422
    )
    assert (
        client.patch(
            "/api/inspections/i1", headers=officer, json={"date": "2026-99-99"}
        ).status_code
        == 422
    )
    assert (
        client.patch(
            "/api/inspections/i1", headers=officer, json={"date": "2026-10-20"}
        ).status_code
        == 200
    )
    assert (
        next(i for i in client.get("/api/inspections", headers=officer).json() if i["id"] == "i1")[
            "date"
        ]
        == "2026-10-20"
    )


def test_query_attachment_ownership(client, applicant):
    assert (
        client.post(
            "/api/queries/q1/respond",
            headers=applicant,
            json={"response": "Updated plan attached.", "document_id": "doc20"},
        ).status_code
        == 422
    )
    r = client.post(
        "/api/queries/q1/respond",
        headers=applicant,
        json={"response": "Updated plan attached.", "document_id": "doc6"},
    )
    assert r.status_code == 200
    assert (
        client.post(
            "/api/queries/q1/respond",
            headers=applicant,
            json={"response": "Updated plan attached again.", "document_id": "doc6"},
        ).status_code
        == 409
    )


def test_notification_read_state(client, applicant):
    assert client.patch("/api/notifications/n0", headers=applicant).status_code == 200
    assert (
        next(
            n for n in client.get("/api/notifications", headers=applicant).json() if n["id"] == "n0"
        )["read"]
        is True
    )
