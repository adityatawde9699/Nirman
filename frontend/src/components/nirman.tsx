"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  Files,
  GitBranch,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  api,
  projectService,
  applicationService,
  complianceService,
  schemeService,
} from "@/lib/api";
import type {
  Application,
  Compliance,
  Notice,
  Project,
  Role,
  Scheme,
  User,
} from "@/lib/types";
import { Alert, Empty, Loading, Logo, Modal } from "./shared";
import { Button } from "./ui/button";
import { Landing, Login } from "./public";
import { Dashboard, Projects, ProjectDetail } from "./dashboard";
import { ProjectWizard } from "./project-wizard";
import { Approvals } from "./approvals";
import { Documents } from "./documents";
import { Applications, ApplicationDetail } from "./applications";
import { CompliancePage, Schemes, Notifications } from "./compliance";
import { OfficerDashboard, Inspections, Queries } from "./officer";
import {
  AdminDashboard,
  RuleManagement,
  Departments,
  AuditLogs,
  ApprovalCatalogue,
  Analytics,
} from "./admin";
import { Assistant } from "./assistant";
import { toast, Toaster } from "./toast";
import { Suspense } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  count?: number;
};
const nav: Record<Role, NavItem[]> = {
  entrepreneur: [
    { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/app/projects", icon: Building2 },
    { label: "Approvals", href: "/app/approvals", icon: FileCheck2 },
    { label: "Documents", href: "/app/documents", icon: Files },
    { label: "Applications", href: "/app/applications", icon: ClipboardCheck },
    { label: "Compliance", href: "/app/compliance", icon: ShieldCheck },
    { label: "Government Schemes", href: "/app/schemes", icon: Landmark },
    { label: "Notifications", href: "/app/notifications", icon: Bell },
  ],
  officer: [
    { label: "Dashboard", href: "/officer/dashboard", icon: LayoutDashboard },
    {
      label: "Applications",
      href: "/officer/applications",
      icon: ClipboardCheck,
    },
    { label: "Application Review", href: "/officer/review", icon: FileCheck2 },
    { label: "Inspections", href: "/officer/inspections", icon: CalendarDays },
    { label: "Queries", href: "/officer/queries", icon: MessageSquareText },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Approval Catalogue", href: "/admin/approvals", icon: FileCheck2 },
    { label: "Regulatory Rules", href: "/admin/rules", icon: GitBranch },
    { label: "Departments", href: "/admin/departments", icon: Landmark },
    { label: "Analytics", href: "/admin/analytics", icon: ChartNoAxesCombined },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: Activity },
  ],
};
function Workspace() {
  const path = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [apps, setApps] = useState<Application[]>([]);
  const [compliance, setCompliance] = useState<Compliance | null>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const [assistant, setAssistant] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const [demoGuide, setDemoGuide] = useState(false);
  const [search, setSearch] = useState("");
  const project =
    projects.find((p) => p.id === projectId) ||
    projects.find((p) => p.id === "p1") ||
    projects[0];
  const isPublic = ["/", "/login", "/register"].includes(path);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nirman-user");
      if (saved && localStorage.getItem("nirman-token"))
        setUser(JSON.parse(saved) as User);
      setProjectId(localStorage.getItem("nirman-project") || "");
    } catch {
      localStorage.removeItem("nirman-user");
    }
    setReady(true);
  }, []);
  const refresh = useCallback(async () => {
    if (!user) return;
    const requestToken = localStorage.getItem("nirman-token");
    setError("");
    try {
      const [p, a, n] = await Promise.all([
        projectService.list(),
        applicationService.list(),
        api<Notice[]>("/notifications"),
      ]);
      if (requestToken !== localStorage.getItem("nirman-token")) return;
      setProjects(p);
      setApps(a);
      setNotices(n);
    } catch (e) {
      if (requestToken !== localStorage.getItem("nirman-token")) return;
      setError((e as Error).message);
      if ((e as Error).message.includes("sign in")) {
        localStorage.removeItem("nirman-token");
        localStorage.removeItem("nirman-user");
        setUser(null);
        router.push("/login");
      }
    }
  }, [user, router]);
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, [user, refresh]);
  useEffect(() => {
    if (!project) {
      setCompliance(null);
      setSchemes([]);
      return;
    }
    Promise.all([
      complianceService.get(project.id),
      schemeService.list(project.id),
    ])
      .then(([c, s]) => {
        setCompliance(c);
        setSchemes(s);
      })
      .catch((e) => setError(e.message));
  }, [project?.id, apps]);
  useEffect(() => {
    if (!ready || isPublic) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const prefix = user.role === "entrepreneur" ? "/app" : `/${user.role}`;
    if (!path.startsWith(prefix + "/")) router.replace(`${prefix}/dashboard`);
  }, [path, user, ready, isPublic, router]);
  useEffect(() => {
    if (user?.role !== "entrepreneur") return;
    const detailId = path.startsWith("/app/project/")
      ? path.split("/")[3]
      : path.startsWith("/app/applications/")
        ? apps.find((a) => a.id === path.split("/")[3])?.project_id
        : undefined;
    if (
      detailId &&
      detailId !== "new" &&
      detailId !== projectId &&
      projects.some((p) => p.id === detailId)
    ) {
      setProjectId(detailId);
      localStorage.setItem("nirman-project", detailId);
    }
  }, [path, projects, apps, projectId, user]);
  function login(token: string, u: User) {
    localStorage.setItem("nirman-token", token);
    localStorage.setItem("nirman-user", JSON.stringify(u));
    setUser(u);
    setProfileMenu(false);
    setProjects([]);
    setApps([]);
    setNotices([]);
    router.push(
      u.role === "entrepreneur" ? "/app/dashboard" : `/${u.role}/dashboard`,
    );
  }
  function logout() {
    localStorage.removeItem("nirman-token");
    localStorage.removeItem("nirman-user");
    setUser(null);
    setProfileMenu(false);
    router.push("/login");
  }
  async function switchRole(role: Role) {
    try {
      const res = await api<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: `${role}@nirman.demo` }),
      });
      login(res.token, res.user);
      toast.success(`Switched to ${role} demo workspace`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  function selectProject(id: string) {
    setProjectId(id);
    localStorage.setItem("nirman-project", id);
  }
  async function created(p: Project) {
    setProjects((old) => [p, ...old]);
    selectProject(p.id);
    toast.success("Project created. Discovering your approval roadmap.");
    router.push("/app/approvals");
    await refresh();
  }
  if (path === "/")
    return (
      <>
        <Landing />
        <Toaster />
      </>
    );
  if (path === "/login" || path === "/register")
    return (
      <>
        <Login register={path === "/register"} onLogin={login} />
        <Toaster />
      </>
    );
  if (!ready || !user) return <Loading label="Opening your workspace…" />;
  let content: React.ReactNode;
  if (loading) content = <Loading />;
  else if (path === "/app/dashboard")
    content = (
      <Dashboard
        project={project}
        applications={apps}
        compliance={compliance}
        schemes={schemes}
        notices={notices}
        onAssistant={() => setAssistant(true)}
      />
    );
  else if (path === "/app/project/new")
    content = <ProjectWizard onCreated={created} />;
  else if (path === "/app/projects") content = <Projects projects={projects} />;
  else if (path.startsWith("/app/project/")) {
    const p = projects.find((p) => p.id === path.split("/")[3]);
    content = <ProjectDetail project={p} />;
  } else if (path === "/app/approvals" || path.startsWith("/app/approvals/"))
    content = (
      <Approvals
        key={project?.id}
        project={project}
        applications={apps}
        onSubmitted={() => void refresh()}
        initialGraph={params.get("view") === "graph"}
        selectedId={path.split("/")[3]}
      />
    );
  else if (path === "/app/documents")
    content = <Documents project={project} onChanged={() => void refresh()} />;
  else if (path === "/app/applications")
    content = <Applications applications={apps} />;
  else if (
    path.startsWith("/app/applications/") ||
    path.startsWith("/officer/applications/")
  )
    content = (
      <ApplicationDetail
        key={path}
        id={path.split("/")[3]}
        user={user}
        onChanged={() => void refresh()}
      />
    );
  else if (path === "/app/compliance")
    content = <CompliancePage compliance={compliance} project={project} />;
  else if (path === "/app/schemes")
    content = <Schemes schemes={schemes} project={project} />;
  else if (path === "/app/notifications")
    content = (
      <Notifications notices={notices} onChanged={() => void refresh()} />
    );
  else if (path === "/officer/dashboard")
    content = <OfficerDashboard applications={apps} />;
  else if (path === "/officer/applications" || path === "/officer/review")
    content = (
      <Applications
        applications={
          path === "/officer/review"
            ? apps.filter((a) => !["Approved", "Rejected"].includes(a.status))
            : apps
        }
        officer
      />
    );
  else if (path === "/officer/inspections")
    content = (
      <Inspections applications={apps} onChanged={() => void refresh()} />
    );
  else if (path === "/officer/queries") content = <Queries />;
  else if (path === "/admin/dashboard") content = <AdminDashboard />;
  else if (path === "/admin/approvals") content = <ApprovalCatalogue />;
  else if (path === "/admin/rules") content = <RuleManagement />;
  else if (path === "/admin/departments") content = <Departments />;
  else if (path === "/admin/analytics")
    content = (
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">PLATFORM INSIGHTS</div>
            <h1>Progress you can measure</h1>
            <p>Illustrative department analytics for the demonstration.</p>
          </div>
        </div>
        <Analytics />
      </>
    );
  else if (path === "/admin/audit-logs") content = <AuditLogs />;
  else
    content = (
      <Empty
        title="This page is not in the demo"
        description="Return to the dashboard to continue your journey."
        href={
          user.role === "entrepreneur"
            ? "/app/dashboard"
            : `/${user.role}/dashboard`
        }
      />
    );
  return (
    <div className="workspace">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="sidebar-logo">
          <Logo light />
          <button
            className="mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobileNav(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="tiny-dot green" />
          {user.role === "entrepreneur"
            ? "APPLICANT WORKSPACE"
            : user.role === "officer"
              ? "OFFICER WORKSPACE"
              : "ADMIN WORKSPACE"}
        </div>
        <div className="nav-section-label">WORKSPACE</div>
        <nav>
          {nav[user.role].map((item) => {
            const active =
              path === item.href ||
              (item.href.includes("applications") &&
                path.startsWith(item.href + "/")) ||
              (item.label === "Projects" && path.startsWith("/app/project/"));
            const count =
              item.label === "Notifications"
                ? notices.filter((n) => !n.read).length
                : item.label === "Documents" && project?.id === "p1"
                  ? 2
                  : 0;
            return (
              <Link
                href={item.href}
                key={item.href}
                className={active ? "active" : ""}
                onClick={() => setMobileNav(false)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {count > 0 && (
                  <small
                    className={
                      item.label === "Documents" ? "warning-count" : ""
                    }
                  >
                    {count}
                  </small>
                )}
                {active && <span className="nav-active-dot" />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
        <button
          className="sidebar-assistant"
          onClick={() => setAssistant(true)}
        >
          <span>
            <Sparkles size={20} />
          </span>
          <div>
            <strong>NIRMAN Assistant</strong>
            <small>Your regulatory co-pilot</small>
          </div>
          <ArrowRight size={15} />
        </button>
        <div className="sidebar-help">
          <button onClick={() => setDemoGuide(true)}>
            <HelpCircle size={17} /> Demo guide <ArrowRight size={14} />
          </button>
        </div>
        <div className="sidebar-status">
          <span className="tiny-dot green" /> Demo services available
          <small>SIH 2026 · SIH26130</small>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="topbar">
          <button
            className="mobile-toggle"
            aria-label="Open navigation"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={21} />
          </button>
          <div className="project-select">
            <span className="project-select-icon">
              <Building2 size={18} />
            </span>
            <div>
              <small>
                {user.role === "entrepreneur"
                  ? "CURRENT PROJECT"
                  : "NIRMAN ORCHESTRATOR"}
              </small>
              {user.role === "entrepreneur" ? (
                <select
                  aria-label="Select project"
                  value={project?.id || ""}
                  onChange={(e) => selectProject(e.target.value)}
                >
                  {projects.length ? (
                    projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Create your first project</option>
                  )}
                </select>
              ) : (
                <strong>
                  {user.role === "officer"
                    ? "Department review workspace"
                    : "Platform administration"}
                </strong>
              )}
            </div>
            <ChevronDown size={13} />
          </div>
          <div className="topbar-right">
            <form
              className="top-search"
              onSubmit={(e) => {
                e.preventDefault();
                if (search.trim()) {
                  router.push(
                    user.role === "entrepreneur"
                      ? "/app/applications"
                      : user.role === "officer"
                        ? "/officer/applications"
                        : "/admin/audit-logs",
                  );
                  toast.success(
                    "Use the page search to find an application or audit event.",
                  );
                  setSearch("");
                }
              }}
            >
              <Search size={16} />
              <input
                aria-label="Search workspace"
                placeholder="Search workspace…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>⌘ K</kbd>
            </form>
            <span className="demo-pill">
              <span /> DEMO MODE
            </span>
            <Link
              href={
                user.role === "entrepreneur"
                  ? "/app/notifications"
                  : user.role === "officer"
                    ? "/officer/queries"
                    : "/admin/audit-logs"
              }
              className="bell-button"
              aria-label="View notifications"
            >
              <Bell size={19} />
              {notices.some((n) => !n.read) && <i />}
            </Link>
            <div className="profile-wrap">
              <button
                className="profile-button"
                onClick={() => setProfileMenu(!profileMenu)}
                aria-label="Open profile and switch demo role"
                aria-expanded={profileMenu}
              >
                <span className="avatar">
                  {user.name
                    .split(" ")
                    .slice(0, 2)
                    .map((x) => x[0])
                    .join("")}
                </span>
                <div>
                  <strong>{user.name}</strong>
                  <small>
                    {user.role === "entrepreneur"
                      ? "Entrepreneur"
                      : user.role === "officer"
                        ? "Government Officer"
                        : "Administrator"}
                  </small>
                </div>
                <ChevronDown size={13} />
              </button>
              {profileMenu && (
                <div className="profile-menu">
                  <span className="eyebrow">SWITCH DEMO ROLE</span>
                  {(["entrepreneur", "officer", "admin"] as Role[]).map((r) => (
                    <button key={r} onClick={() => switchRole(r)}>
                      {r === "entrepreneur" ? (
                        <Building2 size={15} />
                      ) : r === "officer" ? (
                        <Users size={15} />
                      ) : (
                        <ShieldCheck size={15} />
                      )}{" "}
                      {r === "entrepreneur"
                        ? "Entrepreneur"
                        : r === "officer"
                          ? "Government Officer"
                          : "Administrator"}
                      {r === user.role && <Check size={14} />}
                    </button>
                  ))}
                  <button onClick={logout}>
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="demo-strip">
          <ShieldCheck size={13} />
          <span>Prototype / Demonstration Environment</span>
          <i />
          <span>No live government integrations</span>
          <button onClick={() => setDemoGuide(true)}>
            Explore the demo journey <ArrowRight size={12} />
          </button>
        </div>
        <main className="workspace-content">
          {error && (
            <Alert kind="red">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refresh()}
              >
                Retry
              </Button>
            </Alert>
          )}
          {content}
        </main>
        <footer className="workspace-footer">
          <span>© 2026 NIRMAN · Enabling industrial progress</span>
          <span>
            SIH26130 <i /> AI recommends. Rules validate. Officers decide.
          </span>
        </footer>
      </div>
      {assistant && (
        <Assistant project={project} onClose={() => setAssistant(false)} />
      )}
      <Toaster />
      {demoGuide && (
        <Modal
          title="Your interactive demo journey"
          onClose={() => setDemoGuide(false)}
        >
          <p className="modal-description">
            Explore the complete workflow. Switch roles using the profile menu
            in the top-right corner.
          </p>
          <ol className="demo-guide">
            {[
              "Applicant: create a project with industrial and location details.",
              "Discover approvals and inspect the dependency graph.",
              "Upload a PDF or image as Project Report, then run validation.",
              "Open an approval and submit a demonstration application.",
              "Switch to Government Officer and open the new application.",
              "Review the risk factors, raise a query or schedule an inspection.",
              "Applicant: upload an updated document and respond to the query.",
              "Officer: complete any inspection and record a human decision.",
              "Applicant: track the decision, view compliance renewals and discover schemes.",
              "Admin: inspect rule controls and the persistent audit trail.",
            ].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <Alert kind="blue">
            Use the three demo accounts without a password. All source labels
            refer to illustrative demo knowledge, and no real legal approvals
            are submitted.
          </Alert>
        </Modal>
      )}
    </div>
  );
}
export default function Nirman() {
  return (
    <Suspense fallback={<Loading />}>
      <Workspace />
    </Suspense>
  );
}
