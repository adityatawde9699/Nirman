from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Role = Literal["entrepreneur", "officer", "admin"]


class LoginRequest(BaseModel):
    email: str


class Registration(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=200)


class ProjectInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=3, max_length=150)
    company: str = Field(min_length=2)
    applicant: str = Field(min_length=2)
    business_type: str = "Private Limited"
    contact: str = Field(min_length=5)
    industry: str = "Manufacturing"
    sub_sector: str = "Chemical Manufacturing"
    project_type: str = "New facility"
    investment: float = Field(gt=0)
    employees: int = Field(gt=0)
    land: float = Field(gt=0)
    state: str = "Maharashtra"
    district: str = "Pune"
    industrial_area: str = "Chakan MIDC"
    address: str = Field(min_length=5)
    pin: str = Field(pattern=r"^\d{6}$")
    category: str = "Chemical manufacturing"
    power: float = Field(ge=0, default=500)
    water: float = Field(ge=0, default=40)
    waste: str = "Industrial wastewater"
    hazardous: bool = False
    pollution: str = "Orange"


class ApplicationInput(BaseModel):
    project_id: str
    approval_id: str


class QueryInput(BaseModel):
    text: str = Field(min_length=10, max_length=2000)


class ResponseInput(BaseModel):
    response: str = Field(min_length=5)
    document_id: str


class InspectionInput(BaseModel):
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    inspector: str = Field(min_length=2)


class InspectionUpdate(BaseModel):
    date: str | None = None
    status: Literal["Scheduled", "Completed"] | None = None
    report: str | None = None


class DecisionInput(BaseModel):
    decision: Literal["Approved", "Rejected", "Technical Review"]
    comment: str = Field(min_length=5)


class AssistantInput(BaseModel):
    question: str = Field(min_length=3, max_length=1500)
    project_id: str


class RuleUpdate(BaseModel):
    enabled: bool


class RiskInput(BaseModel):
    project_id: str
