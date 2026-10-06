import type {
  Project,
  ProjectData,
  Approval,
  Discovery,
  DocumentRecord,
  Validation,
  Application,
  Compliance,
  Scheme,
  Answer,
} from "./types";
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("nirman-token") : null;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const res = await fetch(`/api${path}`, { ...options, headers });
  if (!res.ok) {
    const data = await res
      .json()
      .catch(() => ({ detail: "Service unavailable" }));
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Please check the entered information",
    );
  }
  return res.json() as Promise<T>;
}
export const approvalService = {
  list: () => api<Approval[]>("/approvals"),
  discover: (id: string) =>
    api<Discovery>(`/projects/${id}/discover-approvals`, { method: "POST" }),
};
export const documentService = {
  list: (id: string) => api<DocumentRecord[]>(`/documents?project_id=${id}`),
  upload: (form: FormData) =>
    api<DocumentRecord>("/documents/upload", { method: "POST", body: form }),
  validate: (id: string) =>
    api<Validation>(`/documents/${id}/validate`, { method: "POST" }),
};
export const complianceService = {
  get: (id: string) => api<Compliance>(`/compliance?project_id=${id}`),
};
export const schemeService = {
  list: (id: string) => api<Scheme[]>(`/schemes?project_id=${id}`),
};
export const aiService = {
  ask: (question: string, id: string) =>
    api<Answer>("/ai/regulatory-assistant", {
      method: "POST",
      body: JSON.stringify({ question, project_id: id }),
    }),
};
export const projectService = {
  list: () => api<Project[]>("/projects"),
  create: (data: ProjectData) =>
    api<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),
};
export const applicationService = {
  list: () => api<Application[]>("/applications"),
  get: (id: string) => api<Application>(`/applications/${id}`),
  submit: (project_id: string, approval_id: string) =>
    api<Application>("/applications", {
      method: "POST",
      body: JSON.stringify({ project_id, approval_id }),
    }),
};
