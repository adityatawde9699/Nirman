"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleCheck,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Loader2,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import type {
  Application,
  User,
  Inspection,
  DocumentRecord,
} from "@/lib/types";
import { api, applicationService } from "@/lib/api";
import {
  Alert,
  Badge,
  Card,
  CardHeading,
  Empty,
  Governance,
  Loading,
  Metric,
  Modal,
  PageHeading,
  date,
} from "./shared";
import { Button } from "./ui/button";
import { toast } from "./toast";
export function ApplicationsTable({
  applications,
  officer = false,
  compact = false,
}: {
  applications: Application[];
  officer?: boolean;
  compact?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [risk, setRisk] = useState("All risk levels");
  const [department, setDepartment] = useState("All departments");
  const [sla, setSla] = useState("All SLAs");
  const filtered = applications.filter(
    (a) =>
      `${a.id} ${a.company} ${a.approval}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === "All statuses" || a.status === status) &&
      (risk === "All risk levels" || a.risk.level === risk) &&
      (department === "All departments" || a.department === department) &&
      (sla === "All SLAs" || a.sla <= 14),
  );
  return (
    <Card className="table-card">
      {!compact && (
        <div className="table-filters">
          <div className="search-input">
            <Search size={16} />
            <input
              placeholder="Search applications or applicants…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search applications"
            />
          </div>
          <select
            aria-label="Filter status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {[
              "All statuses",
              "Under Review",
              "Action Required",
              "Technical Review",
              "Inspection Scheduled",
              "Approved",
              "Rejected",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          {officer && (
            <>
              <select
                aria-label="Filter risk"
                value={risk}
                onChange={(e) => setRisk(e.target.value)}
              >
                {["All risk levels", "Low", "Medium", "High"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <select
                aria-label="Filter department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {[
                  "All departments",
                  "MPCB",
                  "DISH",
                  "FIRE",
                  "LABOUR",
                  "MIDC",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <select
                aria-label="Filter SLA"
                value={sla}
                onChange={(e) => setSla(e.target.value)}
              >
                {["All SLAs", "14 days or less"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </>
          )}
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Application / applicant</th>
              <th>Approval</th>
              {officer && <th>Risk</th>}
              <th>Submitted</th>
              <th>SLA</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, compact ? 5 : 100).map((a) => (
              <tr key={a.id}>
                <td>
                  <Link
                    href={`${officer ? "/officer" : "/app"}/applications/${a.id}`}
                  >
                    <strong className="table-id">{a.id}</strong>
                    <small>{a.company}</small>
                  </Link>
                </td>
                <td>
                  <strong>{a.approval}</strong>
                  <small>
                    {a.department} · {a.industry}
                  </small>
                </td>
                {officer && (
                  <td>
                    <Badge>{a.risk.level}</Badge>
                  </td>
                )}
                <td>{date(a.submitted_at)}</td>
                <td>
                  <span className={a.sla <= 14 ? "amber-text" : ""}>
                    <Clock3 size={13} /> {a.sla_remaining ?? a.sla} days left
                  </span>
                </td>
                <td>
                  <Badge>{a.status}</Badge>
                </td>
                <td>
                  <Link
                    aria-label={`Open ${a.id}`}
                    href={`${officer ? "/officer" : "/app"}/applications/${a.id}`}
                  >
                    <ChevronRight size={17} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <Empty
          title="No applications found"
          description="Adjust your filters or submit a project approval application."
          href={officer ? undefined : "/app/approvals"}
          label="Discover approvals"
        />
      )}
      <div className="table-footer">
        Showing {Math.min(filtered.length, compact ? 5 : 100)} of{" "}
        {filtered.length} applications<span>Persistent demonstration data</span>
      </div>
    </Card>
  );
}
export function Applications({
  applications,
  officer = false,
}: {
  applications: Application[];
  officer?: boolean;
}) {
  return (
    <>
      <PageHeading
        eyebrow={officer ? "DEPARTMENT WORKSPACE" : "APPLICATION WORKFLOW"}
        title={officer ? "Application workbench" : "Your applications"}
        description={
          officer
            ? "Prioritize, review and move applications forward with clear accountability."
            : "Track every application from submission to the official decision."
        }
      >
        {!officer && (
          <Link href="/app/approvals" className="btn btn-primary">
            New application <ArrowRight size={15} />
          </Link>
        )}
      </PageHeading>
      <div className="metrics four">
        <Metric
          label="All applications"
          value={applications.length}
          icon={FileText}
          detail="Across departments"
        />
        <Metric
          label="Under review"
          value={
            applications.filter(
              (a) =>
                !["Approved", "Rejected", "Action Required"].includes(a.status),
            ).length
          }
          icon={Clock3}
          detail="With authorized officers"
        />
        <Metric
          label="Action required"
          value={
            applications.filter((a) => a.status === "Action Required").length
          }
          icon={TriangleAlert}
          tone="amber"
          detail="Responses pending"
        />
        <Metric
          label="Approved"
          value={applications.filter((a) => a.status === "Approved").length}
          icon={FileCheck2}
          tone="green"
          detail="Human decisions recorded"
        />
      </div>
      <ApplicationsTable applications={applications} officer={officer} />
      <Governance compact />
    </>
  );
}
export function ApplicationDetail({
  id,
  user,
  onChanged,
}: {
  id: string;
  user: User;
  onChanged: () => void;
}) {
  const officer = user.role === "officer";
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [inspectionDate, setInspectionDate] = useState("2026-10-15");
  const [inspector, setInspector] = useState("Anjali Deshmukh");
  const [documentId, setDocumentId] = useState("");
  const [queryId, setQueryId] = useState("");
  async function load() {
    try {
      setApp(await applicationService.get(id));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [id]);
  function open(value: string) {
    setAction(value);
    setComment(
      value === "query"
        ? "Please upload the updated environmental report with the latest emission estimates."
        : value === "Approved"
          ? "Documents and technical review completed. Approval recorded by the authorized officer."
          : value === "Rejected"
            ? "Application does not meet the required conditions."
            : value === "Technical Review"
              ? "Document checks reviewed. Forwarding for technical scrutiny."
              : "",
    );
  }
  async function execute(e: React.FormEvent) {
    e.preventDefault();
    if (!app || !action) return;
    setBusy(true);
    try {
      if (action === "query")
        await api(`/applications/${id}/query`, {
          method: "POST",
          body: JSON.stringify({ text: comment }),
        });
      else if (action === "inspection")
        await api(`/applications/${id}/inspection`, {
          method: "POST",
          body: JSON.stringify({ date: inspectionDate, inspector }),
        });
      else if (action === "respond")
        await api(`/queries/${queryId}/respond`, {
          method: "POST",
          body: JSON.stringify({ response: comment, document_id: documentId }),
        });
      else
        await api(`/applications/${id}/decision`, {
          method: "POST",
          body: JSON.stringify({ decision: action, comment }),
        });
      toast.success(
        action === "query"
          ? "Clarification requested. Applicant notified."
          : action === "inspection"
            ? "Inspection scheduled. Applicant notified."
            : action === "respond"
              ? "Response submitted for officer review."
              : `Human decision recorded: ${action}`,
      );
      setAction(null);
      await load();
      onChanged();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (error)
    return (
      <Alert kind="red">
        {error}
        <Button onClick={load}>Retry</Button>
      </Alert>
    );
  if (!app) return <Loading label="Loading application dossier…" />;
  const decided = ["Approved", "Rejected"].includes(app.status);
  const timeline = [
    "Application Submitted",
    "Documents Verified",
    "Officer Assigned",
    "Technical Review",
    "Inspection",
    "Decision",
  ];
  return (
    <>
      <Link
        className="back-link"
        href={`${officer ? "/officer" : "/app"}/applications`}
      >
        <ArrowLeft size={14} /> Back to applications
      </Link>
      <PageHeading
        eyebrow={officer ? "HUMAN-IN-THE-LOOP REVIEW" : "APPLICATION TRACKING"}
        title={app.approval}
        description={`${app.id} · ${app.department} · ${app.company}`}
      >
        <Badge>{app.status}</Badge>
        {!officer && (
          <Link href="/app/documents" className="btn btn-outline">
            Manage documents <FileText size={15} />
          </Link>
        )}
      </PageHeading>
      <div className="application-summary">
        <div>
          <span>Applicant</span>
          <strong>{app.project_data?.applicant}</strong>
        </div>
        <div>
          <span>Project</span>
          <strong>{app.project}</strong>
        </div>
        <div>
          <span>Assigned officer</span>
          <strong>{app.officer}</strong>
        </div>
        <div>
          <span>Estimated SLA</span>
          <strong>
            <Clock3 size={16} /> {app.sla} days
          </strong>
        </div>
        <div>
          <span>Submission date</span>
          <strong>{date(app.submitted_at)}</strong>
        </div>
      </div>
      {officer && (
        <Alert kind="blue">
          <strong>AI recommendation — Human decision required.</strong>
          <p>
            AI assists with document consistency and risk assessment. Only an
            authorized officer can approve or reject.
          </p>
        </Alert>
      )}
      <Card className="mt">
        <CardHeading
          title="Application journey"
          subtitle="A clear record of progress and responsibility"
        />
        <div className="application-timeline">
          {timeline.map((t, i) => {
            const complete =
              decided || i < Math.max(1, Math.min(app.history.length, 4));
            return (
              <div key={t} className={complete ? "complete" : ""}>
                <span>{complete ? <Check size={16} /> : i + 1}</span>
                <strong>{t}</strong>
                <small>
                  {i === 0
                    ? date(app.submitted_at)
                    : complete
                      ? "Completed"
                      : i === 3
                        ? "Current stage"
                        : "Upcoming"}
                </small>
              </div>
            );
          })}
        </div>
      </Card>
      <div className="review-layout">
        <div>
          <Card>
            <CardHeading title="Project & applicant information" />
            <dl className="detail-grid">
              <div>
                <dt>Company</dt>
                <dd>{app.company}</dd>
              </div>
              <div>
                <dt>Industry</dt>
                <dd>{app.industry}</dd>
              </div>
              <div>
                <dt>Investment</dt>
                <dd>₹{app.project_data?.investment} Crore</dd>
              </div>
              <div>
                <dt>Employees</dt>
                <dd>{app.project_data?.employees}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>
                  {app.project_data?.district}, {app.project_data?.state}
                </dd>
              </div>
              <div>
                <dt>Land area</dt>
                <dd>{app.project_data?.land} acres</dd>
              </div>
            </dl>
          </Card>
          <Card className="mt">
            <CardHeading
              title="Submitted documents"
              subtitle="Validation results attached to the project dossier"
            />
            <div className="review-documents">
              {app.documents?.map((d) => (
                <div key={d.id}>
                  <FileText size={18} />
                  <div>
                    <strong>{d.name}</strong>
                    <small>{d.category}</small>
                    {d.validation?.warning && (
                      <p className="amber-text">{d.validation.warning}</p>
                    )}
                  </div>
                  <Badge>{d.status}</Badge>
                  {d.validation && (
                    <small>{d.validation.score}% consistency</small>
                  )}
                </div>
              ))}
            </div>
            {!app.documents?.length && (
              <Empty description="The applicant has not uploaded any documents." />
            )}
          </Card>
          <Card className="mt">
            <CardHeading
              title="Queries & clarifications"
              action={
                officer && !decided ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => open("query")}
                  >
                    <MessageSquareText size={14} /> Raise query
                  </Button>
                ) : undefined
              }
            />
            <div className="query-list">
              {app.queries?.map((q) => (
                <div className="query-card" key={q.id}>
                  <div className="spread">
                    <Badge>{q.status}</Badge>
                    <small>
                      <Clock3 size={13} /> Response due {date(q.due_date)}
                    </small>
                  </div>
                  <p>{q.text}</p>
                  {q.response && (
                    <div className="query-response">
                      <strong>Applicant response</strong>
                      <p>{q.response}</p>
                    </div>
                  )}
                  {!officer && q.status === "Query Raised" && (
                    <div className="spread">
                      <Link className="text-link" href="/app/documents">
                        Upload updated document <ArrowRight size={14} />
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => {
                          setQueryId(q.id);
                          setDocumentId(app.documents?.at(-1)?.id || "");
                          open("respond");
                        }}
                      >
                        Respond to query
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!app.queries?.length && (
              <div className="padded muted">
                No clarification requests for this application.
              </div>
            )}
          </Card>
          <Card className="mt">
            <CardHeading
              title="Inspection history"
              action={
                officer && !decided ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => open("inspection")}
                  >
                    <CalendarDays size={14} /> Schedule
                  </Button>
                ) : undefined
              }
            />
            {app.inspections?.map((i) => (
              <div className="inspection-row" key={i.id}>
                <CalendarDays size={18} />
                <div>
                  <strong>{date(i.date)}</strong>
                  <small>{i.inspector} · Site inspection</small>
                  {i.report && <p>{i.report}</p>}
                </div>
                <Badge>{i.status}</Badge>
              </div>
            ))}
            {!app.inspections?.length && (
              <div className="padded muted">No inspection scheduled.</div>
            )}
          </Card>
          <Card className="mt">
            <CardHeading title="Approval history & officer comments" />
            <div className="history-list">
              {app.history.map((h, i) => (
                <div key={i}>
                  <span className="history-dot" />
                  <div>
                    <strong>{h.action}</strong>
                    <p>{h.comment}</p>
                  </div>
                  <small>{date(h.date)}</small>
                </div>
              ))}
            </div>
          </Card>
          {officer && (
            <Card className="mt">
              <CardHeading
                title="Application audit trail"
                subtitle="Recorded actions on this project and dossier"
              />
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Actor</th>
                      <th>Recorded</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {app.audit_trail?.map((entry, index) => (
                      <tr key={index}>
                        <td>{entry.action}</td>
                        <td>
                          <strong>{entry.user}</strong>
                          <small>{entry.role}</small>
                        </td>
                        <td>{date(entry.timestamp)}</td>
                        <td>
                          <Badge tone="green">{entry.result}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
        <aside>
          <Card className="risk-panel">
            <CardHeading
              title="AI risk assessment"
              action={<Sparkles size={19} className="blue-text" />}
            />
            <div className="risk-score">
              <div className={`risk-ring ${app.risk.level.toLowerCase()}`}>
                <strong>{app.risk.score}</strong>
                <small>out of 100</small>
              </div>
              <Badge>{app.risk.level} risk</Badge>
              <span>Deterministic, explainable scoring</span>
            </div>
            <div className="risk-factors">
              <span className="eyebrow">CONTRIBUTING FACTORS</span>
              {app.risk.factors.map((f) => (
                <div key={f.label}>
                  {f.points > 0 ? (
                    <TriangleAlert size={16} className="amber-text" />
                  ) : (
                    <CircleCheck size={16} className="green-text" />
                  )}
                  <div>
                    <strong>{f.label}</strong>
                    <small>{f.detail}</small>
                  </div>
                  <span className={f.points > 0 ? "amber-text" : "green-text"}>
                    {f.points > 0 ? "+" : ""}
                    {f.points}
                  </span>
                </div>
              ))}
            </div>
            <div className="recommendation">
              <Sparkles size={17} />
              <div>
                <strong>Recommended action</strong>
                <p>{app.risk.recommendation}</p>
              </div>
            </div>
            <details className="scoring-details">
              <summary>How the score is calculated</summary>
              {app.risk.scoring_rules.map((r) => (
                <p key={r}>{r}</p>
              ))}
              <small>
                Expired documents and previous issues are zero in these seeded
                fixtures.
              </small>
            </details>
            <div className="human-required">
              <ShieldCheck size={16} /> Human decision required
            </div>
          </Card>
          {officer && (
            <Card className="mt officer-actions">
              <CardHeading
                title="Officer actions"
                subtitle="Every action is recorded in the audit trail"
              />
              {decided ? (
                <Alert kind={app.status === "Approved" ? "green" : "red"}>
                  <strong>Decision recorded: {app.status}</strong>
                  <p>This application has completed officer review.</p>
                </Alert>
              ) : (
                <div>
                  <Button variant="outline" onClick={() => open("query")}>
                    <MessageSquareText size={16} /> Request Clarification
                  </Button>
                  <Button variant="outline" onClick={() => open("inspection")}>
                    <CalendarDays size={16} /> Schedule Inspection
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => open("Technical Review")}
                  >
                    <ArrowRight size={16} /> Forward for Review
                  </Button>
                  <div className="decision-buttons">
                    <Button onClick={() => open("Approved")}>
                      <Check size={17} /> Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => open("Rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                  <small>
                    Approvals and rejections require your explicit confirmation
                    and recorded comment.
                  </small>
                </div>
              )}
            </Card>
          )}
          <Card className="mt">
            <CardHeading title="SLA monitor" />
            <div className="sla-monitor">
              <Clock3 size={24} />
              <strong>{app.sla_remaining ?? app.sla} days remaining</strong>
              <p>
                Due {date(app.sla_due || app.submitted_at)} · {app.sla} day
                service window
              </p>
              <div className="progress-track">
                <span style={{ width: "62%" }} />
              </div>
              <small>Demo estimates · Department timelines may vary.</small>
            </div>
          </Card>
        </aside>
      </div>
      <Governance />
      {action && (
        <Modal
          title={
            action === "query"
              ? "Request clarification"
              : action === "inspection"
                ? "Schedule site inspection"
                : action === "respond"
                  ? "Respond to officer query"
                  : `Record human decision: ${action}`
          }
          onClose={() => {
            if (!busy) setAction(null);
          }}
        >
          <form onSubmit={execute}>
            {["Approved", "Rejected", "Technical Review"].includes(action) && (
              <Alert kind="blue">
                You are recording this decision as <strong>{user.name}</strong>.
                This is a demonstration action; no legal approval is issued.
              </Alert>
            )}
            {action === "inspection" ? (
              <div className="form-grid">
                <label>
                  Inspection date
                  <input
                    type="date"
                    required
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                  />
                </label>
                <label>
                  Inspector
                  <select
                    value={inspector}
                    onChange={(e) => setInspector(e.target.value)}
                  >
                    {[
                      "Anjali Deshmukh",
                      "Vikram Joshi",
                      "Sunita Rao",
                      "Arun Kulkarni",
                      "Neha Shah",
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <>
                <label className="mt">
                  {action === "respond" ? "Your response" : "Recorded comment"}
                  <textarea
                    required
                    minLength={action === "query" ? 10 : 5}
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </label>
                {action === "respond" && (
                  <label className="mt">
                    Attach updated document
                    <select
                      required
                      value={documentId}
                      onChange={(e) => setDocumentId(e.target.value)}
                    >
                      <option value="">Select an uploaded document</option>
                      {app.documents?.map((d) => (
                        <option value={d.id} key={d.id}>
                          {d.name} · {d.category}
                        </option>
                      ))}
                    </select>
                    <small>
                      Upload a new document in the Documents workspace first.
                    </small>
                  </label>
                )}
              </>
            )}
            <div className="modal-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAction(null)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={action === "Rejected" ? "destructive" : "default"}
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="spin" size={16} />
                ) : (
                  <Check size={16} />
                )}{" "}
                {action === "inspection"
                  ? "Confirm schedule"
                  : action === "query"
                    ? "Send query"
                    : action === "respond"
                      ? "Submit response"
                      : "Confirm human decision"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
