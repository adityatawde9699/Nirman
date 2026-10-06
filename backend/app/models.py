from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    email: Mapped[str] = mapped_column(unique=True)
    role: Mapped[str]
    department_id: Mapped[str | None] = mapped_column(ForeignKey("departments.id"))


class Department(Base):
    __tablename__ = "departments"
    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    short: Mapped[str]


class Project(Base):
    __tablename__ = "projects"
    id: Mapped[str] = mapped_column(primary_key=True)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str]
    data: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Approval(Base):
    __tablename__ = "approvals"
    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    department_id: Mapped[str] = mapped_column(ForeignKey("departments.id"))
    priority: Mapped[str]
    sla: Mapped[int]
    description: Mapped[str]


class ApprovalRule(Base):
    __tablename__ = "approval_rules"
    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    conditions: Mapped[dict] = mapped_column(JSON)
    approval_ids: Mapped[list] = mapped_column(JSON)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class ApprovalDependency(Base):
    __tablename__ = "approval_dependencies"
    id: Mapped[str] = mapped_column(primary_key=True)
    source_id: Mapped[str] = mapped_column(ForeignKey("approvals.id"))
    target_id: Mapped[str] = mapped_column(ForeignKey("approvals.id"))


class Application(Base):
    __tablename__ = "applications"
    id: Mapped[str] = mapped_column(primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    approval_id: Mapped[str] = mapped_column(ForeignKey("approvals.id"))
    status: Mapped[str]
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    history: Mapped[list] = mapped_column(JSON, default=list)
    officer_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[str] = mapped_column(primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    name: Mapped[str]
    category: Mapped[str]
    status: Mapped[str]
    path: Mapped[str | None]
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class DocumentValidation(Base):
    __tablename__ = "document_validations"
    id: Mapped[str] = mapped_column(primary_key=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id"), unique=True)
    result: Mapped[dict] = mapped_column(JSON)


class Query(Base):
    __tablename__ = "queries"
    id: Mapped[str] = mapped_column(primary_key=True)
    application_id: Mapped[str] = mapped_column(ForeignKey("applications.id"))
    text: Mapped[str]
    status: Mapped[str]
    response: Mapped[str | None]
    due_date: Mapped[str]


class Inspection(Base):
    __tablename__ = "inspections"
    id: Mapped[str] = mapped_column(primary_key=True)
    application_id: Mapped[str] = mapped_column(ForeignKey("applications.id"))
    inspector: Mapped[str]
    date: Mapped[str]
    status: Mapped[str]
    report: Mapped[str | None]


class ComplianceRecord(Base):
    __tablename__ = "compliance_records"
    id: Mapped[str] = mapped_column(primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    application_id: Mapped[str | None] = mapped_column(ForeignKey("applications.id"))
    name: Mapped[str]
    due_date: Mapped[str]
    status: Mapped[str]


class Scheme(Base):
    __tablename__ = "schemes"
    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    data: Mapped[dict] = mapped_column(JSON)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[str] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str]
    text: Mapped[str]
    read: Mapped[bool] = mapped_column(default=False)
    link: Mapped[str]


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    user: Mapped[str]
    role: Mapped[str]
    action: Mapped[str]
    entity: Mapped[str]
    result: Mapped[str]
