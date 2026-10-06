"use client";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  FileCheck2,
  FileText,
  Landmark,
  ListChecks,
  Plus,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Badge,
  Calendar,
  Card,
  CardHeading,
  Empty,
  Governance,
  Metric,
  PageHeading,
  date,
} from "./shared";
import type {
  Application,
  Project,
  Compliance,
  Scheme,
  Notice,
} from "@/lib/types";

const progress = [
  { week: "01 Sep", completed: 1, inProgress: 2 },
  { week: "08 Sep", completed: 2, inProgress: 3 },
  { week: "15 Sep", completed: 2, inProgress: 4 },
  { week: "22 Sep", completed: 3, inProgress: 4 },
  { week: "29 Sep", completed: 4, inProgress: 5 },
  { week: "06 Oct", completed: 5, inProgress: 4 },
];
export function Dashboard({
  project,
  applications,
  compliance,
  schemes,
  notices,
  onAssistant,
}: {
  project?: Project;
  applications: Application[];
  compliance: Compliance | null;
  schemes: Scheme[];
  notices: Notice[];
  onAssistant: () => void;
}) {
  const own = applications.filter((a) => a.project_id === project?.id);
  const statuses = {
    ...project?.approval_statuses,
    ...Object.fromEntries(own.map((a) => [a.approval_id, a.status])),
  };
  const approvalIds = project?.approval_ids || [];
  const done = approvalIds.filter((id) => statuses[id] === "Approved").length;
  const active = approvalIds.filter(
    (id) =>
      statuses[id] &&
      !["Approved", "Rejected", "Action Required"].includes(statuses[id]),
  ).length;
  const actions = own.filter((a) => a.status === "Action Required");
  const actionCount = approvalIds.filter(
    (id) => statuses[id] === "Action Required",
  ).length;
  const seeded = project?.id === "p1";
  const percent = approvalIds.length
    ? Math.round((done / approvalIds.length) * 100)
    : 0;
  const chartData = seeded
    ? progress.map((p, i) =>
        i === progress.length - 1
          ? { ...p, completed: done, inProgress: active }
          : p,
      )
    : progress.map((p, i) => ({
        ...p,
        completed: i === progress.length - 1 ? done : 0,
        inProgress: i === progress.length - 1 ? active : 0,
      }));
  const atRisk = own.filter(
    (a) =>
      !["Approved", "Rejected"].includes(a.status) &&
      (a.sla_remaining ?? a.sla) <= 7,
  ).length;
  const nextSteps = seeded
    ? [
        {
          title: "Upload pollution control document",
          text: "Required for Pollution Control Consent",
          icon: FileText,
          color: "amber",
          href: "/app/documents",
          badge: "Document pending",
        },
        {
          title: "Respond to fire safety clarification",
          text: "Fire Department · Response due 12 Oct",
          icon: BellRing,
          color: "red",
          href: actions[0]
            ? `/app/applications/${actions[0].id}`
            : "/app/applications",
          badge: "6 days left",
        },
        {
          title: "Prepare for site inspection",
          text: "MPCB · Scheduled for 12 Oct 2026",
          icon: Building2,
          color: "blue",
          href: "/app/applications",
          badge: "Upcoming",
        },
      ]
    : actions.length
      ? actions.map((a) => ({
          title: `Respond to ${a.approval} clarification`,
          text: a.id,
          icon: BellRing,
          color: "amber",
          href: `/app/applications/${a.id}`,
          badge: "Action required",
        }))
      : own.length
        ? [
            {
              title: done
                ? "Plan your ongoing compliance"
                : "Track your application review",
              text: done
                ? "Your renewal record is ready"
                : "Your application is with the reviewing officer",
              icon: done ? ShieldCheck : Clock3,
              color: done ? "green" : "blue",
              href: done ? "/app/compliance" : "/app/applications",
              badge: done ? "Next milestone" : "Under review",
            },
          ]
        : [
            {
              title: "Prepare your project documents",
              text: "Upload and validate your first project report",
              icon: FileText,
              color: "blue",
              href: "/app/documents",
              badge: "Get started",
            },
            {
              title: "Submit your first approval application",
              text: "Discover applicable requirements and their dependencies",
              icon: FileCheck2,
              color: "blue",
              href: "/app/approvals",
              badge: "Next milestone",
            },
          ];
  return (
    <>
      <PageHeading
        eyebrow="YOUR BUSINESS. MOVING FORWARD."
        title="Project overview"
        description="Every approval, every deadline, every next step — in one place."
      >
        <span className="date-chip">
          <CalendarDays size={15} /> Tuesday, 06 October 2026
        </span>
        <Link className="btn btn-primary" href="/app/project/new">
          <Plus size={16} /> New project
        </Link>
      </PageHeading>
      <div className="project-banner">
        <div className="project-icon">
          <Building2 size={24} />
        </div>
        <div>
          <div className="project-banner-title">
            <h2>{project?.name || "Your next business starts here"}</h2>
            <Badge tone="green">
              {project ? "Active project" : "Get started"}
            </Badge>
          </div>
          <p>
            {project
              ? `${project.data.company} · ${project.data.industrial_area}, ${project.data.district} · ${project.data.sub_sector}`
              : "Create a project profile to discover your industrial approval requirements."}
          </p>
        </div>
        <Link
          href={project ? `/app/project/${project.id}` : "/app/project/new"}
          className="text-link"
        >
          {project ? "View project" : "Create project"}
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="metrics six">
        <Metric
          label="Total approvals"
          value={approvalIds.length}
          icon={ListChecks}
          detail="Across 5 departments"
        />
        <Metric
          label="Completed"
          value={done}
          icon={CircleCheck}
          tone="green"
          detail="+2 this month"
        />
        <Metric
          label="In progress"
          value={active}
          icon={Clock3}
          detail="Moving through review"
        />
        <Metric
          label="Action required"
          value={actionCount}
          icon={TriangleAlert}
          tone="amber"
          detail="Needs your attention"
        />
        <Metric
          label="Compliance score"
          value={`${compliance?.score || 87}%`}
          icon={ShieldCheck}
          tone="green"
          detail="Good standing"
        />
        <Metric
          label="SLA at risk"
          value={atRisk}
          icon={BellRing}
          tone="red"
          detail="Monitor closely"
        />
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <Card>
            <CardHeading
              title="Approval progress"
              subtitle="Your project is steadily moving towards operational readiness"
              action={
                <span className="chart-period">
                  Last 6 weeks <ChevronRight size={13} />
                </span>
              }
            />
            <div className="chart-meta">
              <strong>
                {percent}
                <small>%</small>
              </strong>
              <span>
                overall completion{" "}
                <span className="green-text">↗ 17% this month</span>
              </span>
              <div className="chart-legend">
                <span>
                  <i className="tiny-dot blue" />
                  Completed
                </span>
                <span>
                  <i className="tiny-dot pale" />
                  In progress
                </span>
              </div>
            </div>
            <div className="progress-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 8, left: -30, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="completedFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#2f65ba" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#2f65ba" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e9edf2"
                  />
                  <XAxis
                    dataKey="week"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8490a2", fontSize: 11 }}
                    dy={7}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 6]}
                    tick={{ fill: "#8490a2", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, borderColor: "#e1e7ef" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="inProgress"
                    name="In progress"
                    stroke="#a8c5ec"
                    strokeWidth={2}
                    fill="transparent"
                    strokeDasharray="5 5"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke="#3269b6"
                    strokeWidth={2.5}
                    fill="url(#completedFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-footer">
              <span>
                <CircleCheck size={15} className="green-text" /> {done}{" "}
                approvals completed
              </span>
              <span>Demo reporting period · Oct 2026</span>
            </div>
          </Card>
          <Card className="actions-card">
            <CardHeading
              title="Your next steps"
              subtitle="A little action now keeps your project moving"
              href="/app/notifications"
            />
            {nextSteps.map((a) => (
              <Link className="action-row" href={a.href} key={a.title}>
                <span className={`action-icon ${a.color}`}>
                  <a.icon size={18} />
                </span>
                <div>
                  <strong>{a.title}</strong>
                  <p>{a.text}</p>
                </div>
                <Badge tone={a.color}>{a.badge}</Badge>
                <ChevronRight size={17} />
              </Link>
            ))}
          </Card>
          <Card>
            <CardHeading
              title="Approval pipeline"
              subtitle="The route from registration to compliant operations"
              href="/app/approvals"
            />
            <div className="pipeline">
              {[
                ["a1", "Factory Registration"],
                ["a2", "Pollution Consent"],
                ["a4", "Fire NOC"],
                ["a5", "Labour Registration"],
              ].map(([id, name], i) => {
                const status =
                  statuses[id] === "Approved"
                    ? "Completed"
                    : statuses[id] === "Action Required"
                      ? "Action required"
                      : statuses[id]
                        ? "In progress"
                        : "Not started";
                const tone =
                  status === "Completed"
                    ? "green"
                    : status === "Action required"
                      ? "amber"
                      : status === "In progress"
                        ? "blue"
                        : "gray";
                return (
                  <div key={name}>
                    <span className={`pipeline-dot ${tone}`}>
                      {status === "Completed" ? <Check size={15} /> : i + 1}
                    </span>
                    <strong>{name}</strong>
                    <small>{status}</small>
                    {i < 3 && <ChevronRight size={15} />}
                  </div>
                );
              })}
            </div>
            <div className="pipeline-note">
              <GitBranchIcon />
              <span>4 approvals can run in parallel</span>
              <Link href="/app/approvals?view=graph">
                Explore dependency graph <ArrowRight size={13} />
              </Link>
            </div>
          </Card>
          <Card>
            <CardHeading title="Recent activity" href="/app/notifications" />
            <div className="activity-list">
              {(notices.length
                ? notices.map((n) => ({ title: n.title, text: n.text }))
                : own.map((a) => ({
                    title: `${a.approval} · ${a.status}`,
                    text: a.id,
                  }))
              )
                .slice(0, 3)
                .map((a, i) => (
                  <div className="activity-row" key={a.title}>
                    <span
                      className={`activity-dot ${i === 0 ? "blue" : "green"}`}
                    />
                    <div>
                      <strong>{a.title}</strong>
                      <p>{a.text}</p>
                    </div>
                    <small>{i === 0 ? "Today" : `${i + 1} days ago`}</small>
                  </div>
                ))}
            </div>
          </Card>
        </div>
        <aside className="dashboard-side">
          <section className="assistant-teaser">
            <div className="assistant-spark">
              <Sparkles size={21} />
            </div>
            <span className="eyebrow">YOUR REGULATORY CO-PILOT</span>
            <h3>
              Clarity is a<br />
              conversation away.
            </h3>
            <p>
              Get grounded answers about approvals, documents and your next
              steps.
            </p>
            <button onClick={onAssistant}>
              Ask NIRMAN Assistant <ArrowUpRight size={15} />
            </button>
            <small>
              <ShieldCheck size={12} /> Source-backed demo guidance
            </small>
          </section>
          <Card>
            <CardHeading title="Upcoming deadlines" href="/app/compliance" />
            <div className="deadline-list">
              {(compliance?.records || []).slice(0, 3).map((r, i) => (
                <div key={r.id}>
                  <div className={`deadline-date ${i === 0 ? "amber" : ""}`}>
                    <small>
                      {new Date(r.due_date)
                        .toLocaleDateString("en", { month: "short" })
                        .toUpperCase()}
                    </small>
                    <strong>{new Date(r.due_date).getDate()}</strong>
                  </div>
                  <div>
                    <strong>{r.name}</strong>
                    <p>
                      {i === 0 ? "Renewal approaching" : "Compliance filing"}
                    </p>
                  </div>
                </div>
              ))}
              {!compliance?.records.length && (
                <p className="muted">
                  Renewal deadlines appear after approvals.
                </p>
              )}
            </div>
          </Card>
          <Card>
            <CardHeading title="Compliance calendar" href="/app/compliance" />
            <Calendar
              mini
              events={
                compliance?.records.map((r) => ({
                  date: r.due_date,
                  label: r.name,
                })) || []
              }
            />
          </Card>
          <Card>
            <CardHeading title="Support for your growth" href="/app/schemes" />
            {schemes.slice(0, 2).map((s) => (
              <Link className="scheme-mini" href="/app/schemes" key={s.id}>
                <span className="scheme-icon">
                  <Landmark size={18} />
                </span>
                <div>
                  <strong>{s.name}</strong>
                  <small>
                    <span className="green-text">{s.eligibility}% match</span> ·
                    Recommended
                  </small>
                </div>
                <ChevronRight size={14} />
              </Link>
            ))}
          </Card>
        </aside>
      </div>
      <Governance compact />
    </>
  );
}
function GitBranchIcon() {
  return <ListChecks size={15} />;
}
export function Projects({ projects }: { projects: Project[] }) {
  return (
    <>
      <PageHeading
        title="Your projects"
        description="Build and manage your industrial project profiles."
      >
        <Link href="/app/project/new" className="btn btn-primary">
          <Plus size={16} /> New project
        </Link>
      </PageHeading>
      <div className="projects-grid">
        {projects.map((p) => (
          <Card key={p.id} className="project-card">
            <div className="spread">
              <span className="large-icon">
                <Building2 size={25} />
              </span>
              <Badge tone="green">Active project</Badge>
            </div>
            <h2>{p.name}</h2>
            <p>{p.data.company}</p>
            <div className="project-facts">
              <span>
                Location
                <strong>
                  {p.data.district}, {p.data.state}
                </strong>
              </span>
              <span>
                Investment<strong>₹{p.data.investment} Cr</strong>
              </span>
              <span>
                Industry<strong>{p.data.sub_sector}</strong>
              </span>
            </div>
            <Link className="text-link" href={`/app/project/${p.id}`}>
              Open project <ArrowRight size={15} />
            </Link>
          </Card>
        ))}
      </div>
      {projects.length === 0 && (
        <Empty
          title="Start with your business idea"
          description="Create a profile to discover the applicable approvals."
          href="/app/project/new"
        />
      )}
    </>
  );
}
export function ProjectDetail({ project }: { project?: Project }) {
  if (!project)
    return (
      <Empty
        description="Select a project to view its profile."
        href="/app/project/new"
      />
    );
  return (
    <>
      <PageHeading
        title={project.name}
        description={`${project.data.company} · Project profile and operational details`}
      >
        <Link href="/app/approvals" className="btn btn-primary">
          Discover required approvals <ArrowRight size={16} />
        </Link>
      </PageHeading>
      <div className="two-col">
        <Card>
          <CardHeading title="Industrial profile" />
          <dl className="detail-grid">
            {Object.entries(project.data)
              .filter(
                ([k]) => !["name", "address", "contact", "pin"].includes(k),
              )
              .map(([key, v]) => (
                <div key={key}>
                  <dt>{key.replaceAll("_", " ")}</dt>
                  <dd>
                    {typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)}
                  </dd>
                </div>
              ))}
          </dl>
        </Card>
        <div>
          <Card>
            <CardHeading title="Project location" />
            <div className="map-placeholder">
              <div className="map-roads" />
              <span className="map-pin">
                <Building2 size={22} />
              </span>
              <strong>{project.data.industrial_area}</strong>
              <small>
                {project.data.district}, {project.data.state}
              </small>
              <span className="map-disclaimer">
                Illustrative map · no geolocation service
              </span>
            </div>
            <p className="map-address">
              {project.data.address} — {project.data.pin}
            </p>
          </Card>
          <Card className="mt">
            <CardHeading title="Your next milestone" />
            <p className="muted padded">
              Run approval discovery, upload your documents and submit a
              demonstration application.
            </p>
            <div className="card-buttons">
              <Link href="/app/approvals" className="btn btn-outline">
                Approval discovery
              </Link>
              <Link href="/app/documents" className="btn btn-outline">
                Documents
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
