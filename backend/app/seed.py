from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import (
    Application,
    Approval,
    ApprovalDependency,
    ApprovalRule,
    AuditLog,
    ComplianceRecord,
    Department,
    Document,
    Inspection,
    Notification,
    Project,
    Query,
    Scheme,
    User,
)

APPROVALS = [
    (
        "a1",
        "Factory Registration",
        "d2",
        "High",
        1,
        "Registration of the industrial establishment.",
    ),
    (
        "a2",
        "Pollution Control Consent",
        "d1",
        "High",
        30,
        "Consent to establish for regulated manufacturing activities.",
    ),
    (
        "a3",
        "Factory License",
        "d2",
        "High",
        21,
        "Required for manufacturing units with powered machinery and applicable workforce.",
    ),
    (
        "a4",
        "Fire NOC",
        "d3",
        "High",
        14,
        "Fire safety review for the proposed industrial premises.",
    ),
    (
        "a5",
        "Labour Registration",
        "d4",
        "Medium",
        10,
        "Employer registration and workforce compliance.",
    ),
    (
        "a6",
        "Environmental Approval",
        "d1",
        "High",
        4,
        "Environmental scrutiny for the regulated project category.",
    ),
    (
        "a7",
        "Building Plan Approval",
        "d5",
        "Medium",
        14,
        "Verification of building plans and land use.",
    ),
    (
        "a8",
        "Water Connection",
        "d5",
        "Low",
        7,
        "Industrial water connection authorization.",
    ),
    (
        "a9",
        "Electrical Safety Certificate",
        "d2",
        "Medium",
        10,
        "Safety verification for industrial power installation.",
    ),
    (
        "a10",
        "Trade License",
        "d5",
        "Medium",
        7,
        "Local authorization for industrial business operations.",
    ),
    (
        "a11",
        "Hazardous Waste Authorization",
        "d1",
        "High",
        21,
        "Authorization for handling specified industrial waste.",
    ),
    (
        "a12",
        "Final Operation Clearance",
        "d5",
        "High",
        7,
        "Consolidated readiness check following prerequisite approvals.",
    ),
]
DOC_CATEGORIES = [
    "PAN",
    "GST Certificate",
    "Land Ownership Document",
    "Project Report",
    "Environmental Report",
    "Fire Safety Plan",
    "Pollution Control Document",
]

DEMO_APPROVAL_STATUSES = {
    "a1": "Approved",
    "a2": "Under Review",
    "a3": "Technical Review",
    "a4": "Action Required",
    "a5": "Approved",
    "a6": "Approved",
    "a7": "Under Review",
    "a8": "Under Review",
    "a9": "Approved",
    "a10": "Approved",
    "a11": "Action Required",
    "a12": "Action Required",
}


def seed(db: Session) -> None:
    if db.scalar(select(User).limit(1)):
        # Keep existing demo transactions while backfilling the seeded catalogue.
        p = db.get(Project, "p1")
        if p and "_demo_approval_statuses" not in p.data:
            p.data = {**p.data, "_demo_approval_statuses": DEMO_APPROVAL_STATUSES}
        for aid, duration in [("a1", 1), ("a6", 4)]:
            approval = db.get(Approval, aid)
            if approval:
                approval.sla = duration
        dependency = db.scalar(
            select(ApprovalDependency).where(
                ApprovalDependency.source_id == "a1", ApprovalDependency.target_id == "a5"
            )
        )
        if not dependency and db.get(Approval, "a1") and db.get(Approval, "a5"):
            db.add(ApprovalDependency(id="demo-labour-branch", source_id="a1", target_id="a5"))
        db.commit()
        return
    deps = [
        ("d1", "Maharashtra Pollution Control Board", "MPCB"),
        ("d2", "Directorate of Industrial Safety", "DISH"),
        ("d3", "Fire Department", "FIRE"),
        ("d4", "Labour Department", "LABOUR"),
        ("d5", "Local Authority", "MIDC"),
    ]
    db.add_all([Department(id=i, name=n, short=s) for i, n, s in deps])
    db.flush()
    for i, name in enumerate(["Aditya Sharma", "Priya Mehta", "Rahul Patil"]):
        db.add(
            User(
                id=f"u{i + 1}",
                name=name,
                email="entrepreneur@nirman.demo" if i == 0 else f"applicant{i + 1}@nirman.demo",
                role="entrepreneur",
            )
        )
    for i, name in enumerate(
        ["Anjali Deshmukh", "Vikram Joshi", "Sunita Rao", "Arun Kulkarni", "Neha Shah"]
    ):
        db.add(
            User(
                id=f"o{i + 1}",
                name=name,
                email="officer@nirman.demo" if i == 0 else f"officer{i + 1}@nirman.demo",
                role="officer",
                department_id=f"d{i + 1}",
            )
        )
    db.add(
        User(
            id="admin",
            name="System Administrator",
            email="admin@nirman.demo",
            role="admin",
        )
    )
    db.flush()
    names = [
        "Chakan Manufacturing Unit",
        "Pune Food Processing Plant",
        "Nashik Textile Facility",
        "Aurangabad Auto Components",
        "Nagpur Packaging Unit",
    ]
    for i, n in enumerate(names):
        db.add(
            Project(
                id=f"p{i + 1}",
                owner_id=f"u{1 if i < 3 else i - 1}",
                name=n,
                data={
                    "name": n,
                    "company": "ABC Manufacturing Pvt Ltd" if i == 0 else n + " Pvt Ltd",
                    "applicant": "Aditya Sharma",
                    "business_type": "Private Limited",
                    "contact": "aditya@abcmanufacturing.in",
                    "industry": "Manufacturing",
                    "sub_sector": "Chemical Manufacturing" if i == 0 else "Food processing",
                    "project_type": "New facility",
                    "investment": 15,
                    "employees": 120,
                    "land": 4.2,
                    "state": "Maharashtra",
                    "district": "Pune",
                    "industrial_area": "Chakan MIDC",
                    "address": "Plot 24, Chakan MIDC, Pune",
                    "pin": "410501",
                    "category": "Chemical manufacturing",
                    "power": 500,
                    "water": 40,
                    "waste": "Industrial wastewater",
                    "hazardous": True,
                    "pollution": "Orange",
                },
            )
        )
    db.flush()
    first_project = db.get(Project, "p1")
    first_project.data = {
        **first_project.data,
        "_demo_approval_statuses": DEMO_APPROVAL_STATUSES,
    }
    db.add_all(
        [
            Approval(id=i, name=n, department_id=d, priority=p, sla=s, description=x)
            for i, n, d, p, s, x in APPROVALS
        ]
    )
    db.flush()
    db.add_all(
        [
            ApprovalRule(
                id="r1",
                name="Industrial establishment",
                conditions={"industry": "Manufacturing"},
                approval_ids=["a1", "a3", "a5", "a9"],
            ),
            ApprovalRule(
                id="r2",
                name="Maharashtra industrial premises",
                conditions={"state": "Maharashtra"},
                approval_ids=["a4", "a7", "a8", "a10", "a12"],
            ),
            ApprovalRule(
                id="r3",
                name="Regulated manufacturing",
                conditions={"industry": "Manufacturing", "investment_gt": 10},
                approval_ids=["a2", "a6"],
            ),
            ApprovalRule(
                id="r4",
                name="Hazardous materials handling",
                conditions={"hazardous": True},
                approval_ids=["a11"],
            ),
        ]
    )
    for i, (s, t) in enumerate(
        [
            ("a1", "a3"),
            ("a1", "a2"),
            ("a1", "a4"),
            ("a1", "a5"),
            ("a2", "a6"),
            ("a3", "a12"),
            ("a6", "a12"),
            ("a4", "a12"),
        ]
    ):
        db.add(ApprovalDependency(id=f"dep{i}", source_id=s, target_id=t))
    states = [
        "Approved",
        "Under Review",
        "Technical Review",
        "Action Required",
        "Approved",
        "Approved",
        "Under Review",
        "Approved",
    ]
    for i, st in enumerate(states):
        db.add(
            Application(
                id=f"NIR-2026-{421 + i:05}",
                project_id=f"p{1 if i < 5 else 2}",
                approval_id=f"a{i + 1}",
                status=st,
                officer_id="o1",
                submitted_at=datetime(2026, 9, 24, tzinfo=timezone.utc),
                history=[
                    {
                        "action": "Application Submitted",
                        "date": "2026-09-24",
                        "comment": "Submitted via NIRMAN",
                    },
                    {
                        "action": "Documents Verified",
                        "date": "2026-09-26",
                        "comment": "Document checks completed",
                    },
                    {
                        "action": st,
                        "date": "2026-10-02",
                        "comment": "Assigned to Anjali Deshmukh",
                    },
                ],
            )
        )
    db.flush()
    for i in range(20):
        category = DOC_CATEGORIES[i % 7]
        db.add(
            Document(
                id=f"doc{i + 1}",
                project_id=f"p{1 if i < 6 else 2 + i // 7}",
                name=category.replace(" ", "_") + ".pdf",
                category=category,
                status="Warning" if category == "Fire Safety Plan" else "Verified",
                path=None,
            )
        )
    for i in range(10):
        db.add(
            ComplianceRecord(
                id=f"c{i + 1}",
                project_id=f"p{1 if i < 6 else 2}",
                application_id=None,
                name=[
                    "Factory License Renewal",
                    "Pollution Consent Renewal",
                    "Annual Labour Return",
                    "Fire Safety Audit",
                    "Environmental Monitoring",
                    "Electrical Safety Review",
                ][i % 6],
                due_date=[
                    "2026-10-24",
                    "2026-11-17",
                    "2026-10-28",
                    "2026-10-16",
                    "2026-11-02",
                    "2026-12-10",
                ][i % 6],
                status="Upcoming",
            )
        )
    scheme_names = [
        "Maharashtra Industrial Promotion Subsidy",
        "MSME Credit Guarantee Scheme",
        "Technology Upgradation Support",
        "Energy Efficiency Assistance",
        "Skill Development Incentive",
    ]
    for i, n in enumerate(scheme_names):
        db.add(
            Scheme(
                id=f"s{i + 1}",
                name=n,
                data={
                    "eligibility": 92 - i * 7,
                    "benefit": [
                        "Up to 40% capital investment support",
                        "Collateral-free credit support",
                        "Assistance for modern machinery",
                        "Support for energy-efficient equipment",
                        "Employee training cost reimbursement",
                    ][i],
                    "documents": [
                        "Project Report",
                        "MSME Registration",
                        "Investment Certificate",
                    ],
                    "deadline": "2026-12-31",
                    "source": "Demonstration scheme catalogue",
                    "reason": "Manufacturing sector · Maharashtra · Investment ₹15 Cr",
                    "demo": True,
                },
            )
        )
    db.add(
        Query(
            id="q1",
            application_id="NIR-2026-00424",
            text="Please upload the updated fire safety plan with the emergency exit layout.",
            status="Query Raised",
            response=None,
            due_date="2026-10-12",
        )
    )
    for i in range(3):
        db.add(
            Inspection(
                id=f"i{i + 1}",
                application_id=f"NIR-2026-{422 + i:05}",
                inspector=["Vikram Joshi", "Anjali Deshmukh", "Sunita Rao"][i],
                date=f"2026-10-{12 + i * 3}",
                status="Scheduled",
                report=None,
            )
        )
    for i, (title, txt, link) in enumerate(
        [
            (
                "Clarification requested",
                "Fire safety plan requires an updated emergency exit layout.",
                "/app/applications/NIR-2026-00424",
            ),
            (
                "Factory License expires in 18 days",
                "Plan your renewal before 24 October 2026.",
                "/app/compliance",
            ),
            (
                "Pollution Consent under review",
                "Your documents have been verified by MPCB.",
                "/app/applications/NIR-2026-00422",
            ),
        ]
    ):
        db.add(Notification(id=f"n{i}", user_id="u1", title=title, text=txt, read=False, link=link))
    for i in range(20):
        db.add(
            AuditLog(
                id=f"log{i}",
                user="Aditya Sharma" if i % 2 else "Anjali Deshmukh",
                role="entrepreneur" if i % 2 else "officer",
                action=[
                    "Project Created",
                    "Approval Discovered",
                    "Document Uploaded",
                    "AI Validation Completed",
                    "Officer Reviewed",
                ][i % 5],
                entity=f"p{1 + i % 3}",
                result="Success",
            )
        )
    db.commit()
