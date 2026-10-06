export type Role = "entrepreneur" | "officer" | "admin";
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export interface Project {
  id: string;
  name: string;
  owner_id: string;
  data: ProjectData;
  created_at: string;
  approval_ids: string[];
  approval_statuses: Record<string, string>;
}
export interface ProjectData {
  name: string;
  company: string;
  applicant: string;
  business_type: string;
  contact: string;
  industry: string;
  sub_sector: string;
  project_type: string;
  investment: number;
  employees: number;
  land: number;
  state: string;
  district: string;
  industrial_area: string;
  address: string;
  pin: string;
  category: string;
  power: number;
  water: number;
  waste: string;
  hazardous: boolean;
  pollution: string;
}
export interface Approval {
  id: string;
  name: string;
  department_id: string;
  priority: string;
  sla: number;
  description: string;
  reasons?: string[];
  status?: string;
}
export interface Validation {
  extracted: Record<string, string | number>;
  checks: {
    field: string;
    matches: boolean;
    profile: string | number;
    extracted: string | number;
  }[];
  score: number;
  warning: string | null;
  provider: string;
}
export interface DocumentRecord {
  id: string;
  name: string;
  category: string;
  status: string;
  uploaded_at: string;
  validation: Validation | null;
}
export interface Risk {
  score: number;
  level: string;
  factors: { label: string; points: number; detail: string }[];
  missing: string[];
  recommendation: string;
  disclaimer: string;
  scoring_rules: string[];
}
export interface QueryRecord {
  id: string;
  application_id?: string;
  text: string;
  status: string;
  response: string | null;
  due_date: string;
}
export interface Inspection {
  id: string;
  application_id: string;
  date: string;
  inspector: string;
  status: string;
  report: string | null;
  location?: string;
}
export interface Application {
  id: string;
  project_id: string;
  approval_id: string;
  approval: string;
  department: string;
  company: string;
  project: string;
  industry: string;
  status: string;
  sla: number;
  sla_remaining: number;
  sla_due: string;
  audit_trail?: {
    action: string;
    user: string;
    role: string;
    timestamp: string;
    result: string;
  }[];
  submitted_at: string;
  history: { action: string; date: string; comment: string }[];
  risk: Risk;
  officer: string;
  project_data?: ProjectData;
  documents?: DocumentRecord[];
  queries?: QueryRecord[];
  inspections?: Inspection[];
}
export interface Scheme {
  id: string;
  name: string;
  eligibility: number;
  benefit: string;
  documents: string[];
  deadline: string;
  source: string;
  reason: string;
  demo: boolean;
}
export interface Compliance {
  score: number;
  records: { id: string; name: string; due_date: string; status: string }[];
}
export interface Notice {
  id: string;
  title: string;
  text: string;
  read: boolean;
  link: string;
}
export interface Audit {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  result: string;
}
export interface Rule {
  id: string;
  name: string;
  conditions: Record<string, string | number | boolean>;
  approval_ids: string[];
  enabled: boolean;
}
export interface Department {
  id: string;
  name: string;
  short: string;
}
export interface Answer {
  answer: string;
  source: string;
  rule: string;
  explanation: string;
  provider: string;
  demo: boolean;
}
export interface Discovery {
  approvals: Approval[];
  dependencies: { source: string; target: string }[];
  critical_path_days: number;
  parallelizable: number;
}
