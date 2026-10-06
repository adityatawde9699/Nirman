"""Replaceable orchestration adapters. All regulatory content here is demo data."""

import logging
import os
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import (
    Approval,
    ApprovalRule,
    Document,
    Project,
    Scheme,
)
from .seed import DOC_CATEGORIES


class ApprovalService:
    def discover(self, db: Session, project: Project) -> list[dict]:
        found: dict[str, list[str]] = {}
        for rule in db.scalars(select(ApprovalRule).where(ApprovalRule.enabled.is_(True))):
            matched = all(
                float(project.data.get(k[:-3], 0)) > v
                if k.endswith("_gt")
                else project.data.get(k) == v
                for k, v in rule.conditions.items()
            )
            if matched:
                for aid in rule.approval_ids:
                    found.setdefault(aid, []).append(rule.name)
        return [
            {
                "id": a.id,
                "name": a.name,
                "department_id": a.department_id,
                "priority": a.priority,
                "sla": a.sla,
                "description": a.description,
                "reasons": found[a.id],
                "source": "NIRMAN demonstration regulatory rule set",
                "status": "Required",
            }
            for a in db.scalars(select(Approval).where(Approval.id.in_(found)))
        ]


class OCRAdapter:
    def extract(self, document: Document, project: Project) -> dict:
        # Deterministic fixture intentionally exercises the judging discrepancy flow.
        return {
            "company": project.data["company"],
            "investment": project.data["investment"],
            "land": project.data["land"],
            "employees": 100
            if document.category == "Project Report"
            else project.data["employees"],
            "industry": project.data["sub_sector"],
            "address": project.data["address"],
            "provider": "Mock OCR fixture — not extracted from file contents",
        }


class DocumentService:
    def validate(self, document: Document, project: Project) -> dict:
        extracted = OCRAdapter().extract(document, project)
        checks = [
            {
                "field": field,
                "matches": extracted[field] == project.data[field],
                "profile": project.data[field],
                "extracted": extracted[field],
            }
            for field in ["company", "investment", "address", "employees"]
        ]
        warning = any(not c["matches"] for c in checks)
        return {
            "extracted": extracted,
            "checks": checks,
            "score": 92 if warning else 100,
            "warning": "Employee count differs from project profile. Please reconcile before final review."
            if warning
            else None,
            "provider": "Deterministic demo OCR",
        }


class RiskService:
    def analyze(self, db: Session, project: Project) -> dict:
        docs = list(db.scalars(select(Document).where(Document.project_id == project.id)))
        latest = {d.category: d for d in sorted(docs, key=lambda d: d.uploaded_at)}
        docs = list(latest.values())
        categories = {d.category for d in docs}
        missing = [c for c in DOC_CATEGORIES if c not in categories]
        inconsistent = any(d.status == "Warning" for d in docs)
        factors = [
            {
                "label": "Missing required documents" if missing else "Required documents present",
                "points": 25 if missing else 0,
                "detail": ", ".join(missing) or "All seven document categories supplied",
            },
            {
                "label": "Cross-document inconsistency" if inconsistent else "Documents consistent",
                "points": 20 if inconsistent else 0,
                "detail": "Review flagged document fields"
                if inconsistent
                else "No validation warnings",
            },
            {
                "label": "High-risk industry"
                if project.data.get("hazardous")
                else "Standard industry category",
                "points": 20 if project.data.get("hazardous") else 0,
                "detail": project.data.get("sub_sector", "Manufacturing"),
            },
            {
                "label": "Complete documentation" if not missing else "Documentation incomplete",
                "points": -15 if not missing else 0,
                "detail": "Documentation completeness adjustment",
            },
        ]
        factors.extend(
            [
                {
                    "label": "Expired document",
                    "points": 15 if any(d.status == "Expired" for d in docs) else 0,
                    "detail": "An uploaded document is expired"
                    if any(d.status == "Expired" for d in docs)
                    else "No expired documents in the fixture",
                },
                {
                    "label": "Previous compliance issue",
                    "points": 15 if project.data.get("previous_compliance_issue", False) else 0,
                    "detail": "Historical project compliance flag"
                    if project.data.get("previous_compliance_issue", False)
                    else "No historical issues recorded",
                },
            ]
        )
        score = max(0, min(100, sum(f["points"] for f in factors)))
        return {
            "score": score,
            "level": "Low" if score < 35 else "Medium" if score < 65 else "High",
            "factors": factors,
            "missing": missing,
            "recommendation": "Request clarification on missing or inconsistent documents."
            if missing or inconsistent
            else "Proceed to technical review.",
            "disclaimer": "AI recommendation — Human decision required.",
            "scoring_rules": [
                "Missing document: +25",
                "Cross-document inconsistency: +20",
                "Expired document: +15",
                "High-risk industry: +20",
                "Previous compliance issue: +15",
                "Complete documentation: −15",
            ],
        }


class ComplianceService:
    def score(self, records: list) -> int:
        return 87 if records else 100


class SchemeService:
    def recommend(self, db: Session, project: Project) -> list[dict]:
        return [
            {
                "id": s.id,
                "name": s.name,
                **s.data,
                "eligibility": max(
                    30,
                    s.data["eligibility"]
                    - (0 if project.data.get("state") == "Maharashtra" else 15),
                ),
                "reason": f"{project.data.get('industry')} sector · {project.data.get('state')} · Investment ₹{project.data.get('investment')} Cr",
            }
            for s in db.scalars(select(Scheme))
        ]


class AIService:
    def answer(self, db: Session, question: str, project: Project) -> dict[str, Any]:
        q = question.lower()
        discovered = ApprovalService().discover(db, project)
        if "missing" in q or "document" in q:
            missing = RiskService().analyze(db, project)["missing"]
            answer = (
                "Missing documents: " + ", ".join(missing)
                if missing
                else "All required document categories are present. Review validation warnings before submission."
            )
            rule = "The application checklist requires identity, land, project, environment and safety documents."
        elif "parallel" in q or "sequence" in q:
            answer = "Complete Factory Registration first. Factory License, Pollution Consent, Fire NOC and Labour Registration can progress in parallel. Environmental Approval follows Pollution Consent. Final Operation Clearance follows prerequisite approvals."
            rule = "Prerequisite approvals must be completed before final operation clearance."
        elif "pollution" in q:
            answer = f"Pollution Control Consent is recommended because your {project.data['sub_sector']} project is classified as {project.data['pollution']} and is located in {project.data['state']}."
            if not any(a["id"] == "a2" for a in discovered):
                answer = "Pollution Control Consent does not match an enabled demonstration rule for this project profile. Inspect discovery conditions or ask the administrator to review the catalogue."
            rule = "Regulated manufacturing with investment above ₹10 Cr triggers pollution scrutiny in this demonstration rule set."
        else:
            answer = (
                f"{len(discovered)} approvals match your profile: "
                + ", ".join(a["name"] for a in discovered)
                + ". Open Approval Discovery to see each matched rule."
            )
            rule = "Approval applicability is determined from industry, location, investment and hazardous-material handling."
        result = {
            "answer": answer,
            "source": "NIRMAN demonstration regulatory knowledge catalogue",
            "rule": rule,
            "explanation": f"Based on {project.data['company']}, {project.data['state']}, {project.data['employees']} employees and ₹{project.data['investment']} Cr investment.",
            "provider": "Deterministic demo assistant",
            "demo": True,
        }
        # Optional LLM only rephrases the grounded explanation; rules remain deterministic.
        if os.getenv("OPENAI_API_KEY"):
            try:
                import httpx

                response = httpx.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
                    json={
                        "model": os.getenv("AI_MODEL", "gpt-4.1-mini"),
                        "messages": [
                            {
                                "role": "system",
                                "content": "Explain only the supplied DEMO facts in two sentences. Do not add regulatory facts or make decisions.",
                            },
                            {"role": "user", "content": str(result)},
                        ],
                    },
                    timeout=12,
                )
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]
                if not isinstance(content, str) or not content.strip():
                    raise ValueError("Empty LLM explanation")
                result["answer"] = content
                result["provider"] = "LLM explanation grounded in demo rules"
            except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as error:
                logging.getLogger(__name__).info(
                    "Optional LLM explanation unavailable: %s", type(error).__name__
                )
        return result


approvalService = ApprovalService()
documentService = DocumentService()
riskService = RiskService()
complianceService = ComplianceService()
schemeService = SchemeService()
aiService = AIService()
