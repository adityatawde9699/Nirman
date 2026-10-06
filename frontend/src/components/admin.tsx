"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  FileText,
  GitBranch,
  Landmark,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Approval, Audit, Department, Rule } from "@/lib/types";
import { api } from "@/lib/api";
import {
  Alert,
  Badge,
  Card,
  CardHeading,
  Empty,
  Governance,
  Loading,
  Metric,
  PageHeading,
  date,
} from "./shared";
import { Button } from "./ui/button";
import { toast } from "./toast";
export function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    api<Record<string, number>>("/admin/dashboard")
      .then(setStats)
      .catch((e) => toast.error(e.message));
  }, []);
  return (
    <>
      <PageHeading
        eyebrow="PLATFORM ADMINISTRATION"
        title="An accountable approval ecosystem"
        description="Manage the catalogue, rule engine and system activity from one workspace."
      />
      <div className="metrics six">
        {(
          [
            { key: "departments", label: "Departments", icon: Landmark },
            { key: "approvals", label: "Approval catalogue", icon: FileText },
            { key: "rules", label: "Regulatory rules", icon: GitBranch },
            { key: "users", label: "Demo users", icon: Users },
            { key: "projects", label: "Projects", icon: Building2 },
            { key: "events", label: "Audit events", icon: Activity },
          ] as const
        ).map((m) => (
          <Metric
            key={m.key}
            label={m.label}
            value={stats?.[m.key] || 0}
            icon={m.icon}
            detail="Live demonstration data"
          />
        ))}
      </div>
      <div className="two-col">
        <Card>
          <CardHeading title="Regulatory configuration" />
          <div className="admin-navigation">
            {[
              [
                "Approval rules",
                "Enable or disable deterministic applicability rules",
                "/admin/rules",
              ],
              [
                "Approval catalogue",
                "View department requirements and SLAs",
                "/admin/approvals",
              ],
              [
                "Departments",
                "Explore the five participating demo departments",
                "/admin/departments",
              ],
            ].map(([title, text, href]) => (
              <Link href={href} key={href}>
                <ShieldCheck size={20} />
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeading title="Governance by design" />
          <div className="admin-principles">
            <h2>
              AI recommends.
              <br />
              Rules validate.
              <br />
              Officers decide.
            </h2>
            <p>
              Regulatory applicability is transparent and configurable. Human
              decisions and key workflow actions are recorded in the audit
              trail.
            </p>
            <Link className="text-link" href="/admin/audit-logs">
              Inspect audit trail <ArrowRight size={15} />
            </Link>
          </div>
        </Card>
      </div>
      <Analytics />
    </>
  );
}
export function RuleManagement() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([api<Rule[]>("/admin/rules"), api<Approval[]>("/approvals")])
      .then(([r, a]) => {
        setRules(r);
        setApprovals(a);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function toggle(r: Rule) {
    setBusy(r.id);
    try {
      await api(`/admin/rules/${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !r.enabled }),
      });
      setRules((old) =>
        old.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)),
      );
      toast.success(
        `Rule ${r.enabled ? "disabled" : "enabled"}. Discovery will use the updated catalogue.`,
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="REGULATORY KNOWLEDGE ENGINE"
        title="Rules you can inspect. Logic you can trust."
        description="Configure the deterministic rule catalogue used by approval discovery."
      />
      <Alert kind="blue">
        <strong>Demonstration rules, not legal advice.</strong>
        <p>
          Rule changes affect the next discovery run. Existing applications
          retain their review history.
        </p>
      </Alert>
      {loading ? (
        <Loading />
      ) : (
        <div className="rules-grid">
          {rules.map((r) => (
            <Card className="rule-card" key={r.id}>
              <div className="spread">
                <div>
                  <span className="eyebrow">
                    {r.id.toUpperCase()} · APPLICABILITY RULE
                  </span>
                  <h3>{r.name}</h3>
                </div>
                <button
                  className={`switch ${r.enabled ? "on" : ""}`}
                  role="switch"
                  aria-checked={r.enabled}
                  aria-label={`Enable ${r.name}`}
                  disabled={busy === r.id}
                  onClick={() => toggle(r)}
                >
                  <span />
                </button>
              </div>
              <div className="rule-logic">
                <span>IF</span>
                {Object.entries(r.conditions).map(([k, v], i) => (
                  <div key={k}>
                    {i > 0 && <small>AND</small>}
                    <code>
                      {k.replace("_gt", "")} {k.endsWith("_gt") ? ">" : "="}{" "}
                      {String(v)}
                    </code>
                  </div>
                ))}
                <span>THEN REQUIRE</span>
                <div className="document-pills">
                  {r.approval_ids.map((id) => (
                    <span key={id}>
                      {approvals.find((a) => a.id === id)?.name || id}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rule-footer">
                <Badge tone={r.enabled ? "green" : "gray"}>
                  {r.enabled ? "Enabled" : "Disabled"}
                </Badge>
                <small>Changes are recorded in the audit trail.</small>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
export function Departments() {
  const [items, setItems] = useState<Department[]>([]);
  useEffect(() => {
    api<Department[]>("/departments")
      .then(setItems)
      .catch((e) => toast.error(e.message));
  }, []);
  return (
    <>
      <PageHeading
        title="Connected departments"
        description="Five demonstration departments, one orchestrated industrial workflow."
      />
      <div className="projects-grid">
        {items.map((d) => (
          <Card className="department-card" key={d.id}>
            <span className="large-icon">
              <Landmark size={26} />
            </span>
            <span className="eyebrow">{d.short}</span>
            <h2>{d.name}</h2>
            <Badge tone="green">Demo adapter active</Badge>
            <p>
              Applications and review workflows run within NIRMAN’s
              demonstration environment.
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}
export function AuditLogs() {
  const [items, setItems] = useState<Audit[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<Audit[]>("/admin/audit-logs")
      .then(setItems)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);
  const filtered = items.filter((a) =>
    `${a.user} ${a.action} ${a.entity}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="ACCOUNTABILITY & TRACEABILITY"
        title="Every important action. On the record."
        description="Project changes, AI validations and human decisions form a connected audit trail."
      />
      <Card>
        <div className="table-filters">
          <div className="search-input">
            <Search size={16} />
            <input
              placeholder="Search user, action or entity…"
              aria-label="Search audit log"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="muted">{filtered.length} audit events</span>
        </div>
        {loading ? (
          <Loading />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User / role</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.timestamp).toLocaleString("en-IN")}</td>
                    <td>
                      <strong>{a.user}</strong>
                      <small>{a.role}</small>
                    </td>
                    <td>{a.action}</td>
                    <td>
                      <code>{a.entity.slice(0, 23)}</code>
                    </td>
                    <td>
                      <Badge tone="green">{a.result}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!filtered.length && !loading && (
          <Empty description="No audit events match your search." />
        )}
      </Card>
    </>
  );
}
export function ApprovalCatalogue() {
  const [items, setItems] = useState<Approval[]>([]);
  useEffect(() => {
    api<Approval[]>("/approvals")
      .then(setItems)
      .catch((e) => toast.error(e.message));
  }, []);
  return (
    <>
      <PageHeading
        title="Approval catalogue"
        description="Transparent requirements, responsible departments, and demonstration service windows."
      />
      <Card>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Approval</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Estimated SLA</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.name}</strong>
                    <small>{a.description}</small>
                  </td>
                  <td>
                    {
                      (
                        {
                          d1: "MPCB",
                          d2: "DISH",
                          d3: "FIRE",
                          d4: "LABOUR",
                          d5: "MIDC",
                        } as Record<string, string>
                      )[a.department_id]
                    }
                  </td>
                  <td>
                    <Badge>{a.priority}</Badge>
                  </td>
                  <td>{a.sla} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
export function Analytics() {
  const chart = [
    { name: "MPCB", received: 42, completed: 28 },
    { name: "Industrial Safety", received: 35, completed: 25 },
    { name: "Fire", received: 29, completed: 20 },
    { name: "Labour", received: 24, completed: 19 },
    { name: "Local Authority", received: 18, completed: 12 },
  ];
  return (
    <>
      <div className="section-title">
        <div>
          <h2>Department performance</h2>
          <p>Illustrative analytics · seeded SIH reporting period</p>
        </div>
        <Badge tone="blue">Demo reporting data</Badge>
      </div>
      <Card>
        <CardHeading
          title="Application volume & completion"
          subtitle="Illustrative monthly department figures"
        />
        <div className="analytics-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#738299" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#738299" }}
              />
              <Tooltip />
              <Bar
                dataKey="received"
                name="Received"
                fill="#d0def0"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="completed"
                name="Completed"
                fill="#355f9d"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}
