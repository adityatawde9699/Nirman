"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardCheck,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  TriangleAlert,
  Upload,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Application, Inspection, QueryRecord } from "@/lib/types";
import {
  Alert,
  Badge,
  Calendar,
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
import { ApplicationsTable } from "./applications";
import { toast } from "./toast";
export function OfficerDashboard({
  applications,
}: {
  applications: Application[];
}) {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    api<Record<string, number>>("/officer/dashboard")
      .then(setStats)
      .catch((e) => toast.error(e.message));
  }, [applications]);
  return (
    <>
      <PageHeading
        eyebrow="GOVERNMENT OFFICER WORKSPACE"
        title="Good governance. Clear decisions."
        description="Your department’s applications, priorities and inspection workload."
      >
        <span className="date-chip">
          <CalendarDays size={15} /> 06 October 2026
        </span>
        <Link href="/officer/applications" className="btn btn-primary">
          Open workbench <ArrowRight size={16} />
        </Link>
      </PageHeading>
      <div className="officer-banner">
        <ShieldCheck size={24} />
        <div>
          <h3>Maharashtra Pollution Control Board</h3>
          <p>Welcome, Anjali Deshmukh · Authorized reviewing officer</p>
        </div>
        <Badge tone="blue">Department workspace</Badge>
      </div>
      <div className="metrics six">
        <Metric
          label="Applications received"
          value={stats?.received || applications.length}
          icon={FileText}
          detail="Seeded + live demo applications"
        />
        <Metric
          label="Pending review"
          value={stats?.pending || 0}
          icon={ClipboardCheck}
          detail="Awaiting officer action"
        />
        <Metric
          label="SLA at risk"
          value={stats?.sla_at_risk || 0}
          icon={Clock3}
          tone="amber"
          detail="Demo monitoring estimate"
        />
        <Metric
          label="High risk"
          value={stats?.high_risk || 0}
          icon={TriangleAlert}
          tone="red"
          detail="Risk engine classification"
        />
        <Metric
          label="Inspections scheduled"
          value={stats?.inspections || 0}
          icon={CalendarDays}
          detail="Site visits pending"
        />
        <Metric
          label="Avg. processing time"
          value={`${stats?.average_days || 8.4} d`}
          icon={Clock3}
          tone="green"
          detail="Illustrative reporting metric"
        />
      </div>
      <Alert kind="blue">
        <strong>AI recommends. You decide.</strong>
        <p>
          Document validation and risk recommendations support scrutiny. All
          final regulatory decisions remain with authorized officers.
        </p>
      </Alert>
      <div className="section-title">
        <div>
          <h2>Applications requiring attention</h2>
          <p>Prioritize pending reviews and outstanding clarifications.</p>
        </div>
        <Link className="text-link" href="/officer/applications">
          View all applications <ArrowRight size={15} />
        </Link>
      </div>
      <ApplicationsTable
        applications={applications.filter(
          (a) => !["Approved", "Rejected"].includes(a.status),
        )}
        officer
        compact
      />
      <div className="two-col mt">
        <Card>
          <CardHeading title="Inspection readiness" />
          <div className="officer-callout">
            <CalendarDays size={35} />
            <div>
              <h3>Make every site visit count.</h3>
              <p>
                Schedule inspections, record findings and attach the report
                before a decision.
              </p>
              <Link href="/officer/inspections" className="text-link">
                Manage inspections <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeading title="Clarifications, connected" />
          <div className="officer-callout">
            <MessageSquareText size={35} />
            <div>
              <h3>A clear query. A faster response.</h3>
              <p>
                Track applicant responses and keep an accountable record of each
                exchange.
              </p>
              <Link href="/officer/queries" className="text-link">
                Open query management <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
export function Inspections({
  applications,
  onChanged,
}: {
  applications: Application[];
  onChanged: () => void;
}) {
  const [items, setItems] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Inspection | null>(null);
  const [mode, setMode] = useState("schedule");
  const [appId, setAppId] = useState("");
  const [when, setWhen] = useState("2026-10-15");
  const [inspector, setInspector] = useState("Anjali Deshmukh");
  const [report, setReport] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      setItems(await api<Inspection[]>("/inspections"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "schedule")
        await api(`/applications/${appId}/inspection`, {
          method: "POST",
          body: JSON.stringify({ date: when, inspector }),
        });
      else if (selected)
        await api(`/inspections/${selected.id}`, {
          method: "PATCH",
          body: JSON.stringify(
            mode === "complete"
              ? { status: "Completed", report }
              : { date: when },
          ),
        });
      toast.success(
        mode === "complete"
          ? "Inspection completed. Report saved."
          : mode === "schedule"
            ? "Inspection scheduled"
            : "Inspection rescheduled",
      );
      setSelected(null);
      setAppId("");
      await load();
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="INSPECTION MANAGEMENT"
        title="From desk review to site readiness"
        description="Schedule visits, record findings and keep the inspection trail connected."
      >
        <Button
          onClick={() => {
            setMode("schedule");
            setAppId(
              applications.find(
                (a) => !["Approved", "Rejected"].includes(a.status),
              )?.id || "",
            );
            setSelected(null);
          }}
        >
          <CalendarDays size={16} /> Schedule inspection
        </Button>
      </PageHeading>
      <div className="two-col inspection-layout">
        <div>
          {loading ? (
            <Loading />
          ) : (
            items.map((i) => (
              <Card className="inspection-card" key={i.id}>
                <div className="spread">
                  <span className="eyebrow">SITE INSPECTION</span>
                  <Badge>{i.status}</Badge>
                </div>
                <h2>{date(i.date)}</h2>
                <Link
                  className="text-link"
                  href={`/officer/applications/${i.application_id}`}
                >
                  {i.application_id}
                  <ArrowRight size={14} />
                </Link>
                <div className="inspection-facts">
                  <p>
                    <Users size={16} /> {i.inspector}
                  </p>
                  <p>
                    <MapPin size={16} /> {i.location}
                  </p>
                </div>
                {i.report && (
                  <div className="query-response">
                    <strong>Inspection report</strong>
                    <p>{i.report}</p>
                  </div>
                )}
                {i.status !== "Completed" && (
                  <div className="card-buttons">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMode("reschedule");
                        setSelected(i);
                        setWhen(i.date);
                      }}
                    >
                      Reschedule
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setMode("complete");
                        setSelected(i);
                        setReport("");
                      }}
                    >
                      <Check size={14} /> Complete & add report
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
          {!items.length && !loading && (
            <Empty description="Schedule an inspection from an application review." />
          )}
        </div>
        <Card>
          <CardHeading title="Inspection calendar" />
          <Calendar
            events={items.map((i) => ({
              date: i.date,
              label: `${i.inspector} · ${i.application_id}`,
            }))}
          />
          <Alert kind="blue">
            Calendar markers illustrate the seeded October schedule. Newly
            scheduled dates appear in the inspection list.
          </Alert>
        </Card>
      </div>
      {(selected || appId) && (
        <Modal
          title={
            mode === "schedule"
              ? "Schedule an inspection"
              : mode === "complete"
                ? "Complete inspection & record findings"
                : "Reschedule inspection"
          }
          onClose={() => {
            setSelected(null);
            setAppId("");
          }}
        >
          <form onSubmit={submit}>
            {mode === "schedule" && (
              <label>
                Application
                <select
                  required
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                >
                  {applications
                    .filter((a) => !["Approved", "Rejected"].includes(a.status))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.id} · {a.approval}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {mode !== "complete" ? (
              <div className="form-grid mt">
                <label>
                  Date
                  <input
                    required
                    type="date"
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                  />
                </label>
                {mode === "schedule" && (
                  <label>
                    Inspector
                    <input
                      required
                      value={inspector}
                      onChange={(e) => setInspector(e.target.value)}
                    />
                  </label>
                )}
              </div>
            ) : (
              <>
                <label>
                  Inspection report
                  <textarea
                    rows={5}
                    required
                    minLength={10}
                    placeholder="Record findings, evidence and any observations…"
                    value={report}
                    onChange={(e) => setReport(e.target.value)}
                  />
                </label>
                <label className="report-upload">
                  <Upload size={17} /> Attach text report
                  <input
                    type="file"
                    accept=".txt"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setReport(await f.text());
                    }}
                  />
                  <small>
                    Text reports are stored in the inspection record.
                  </small>
                </label>
              </>
            )}
            <div className="modal-actions">
              <Button disabled={busy} type="submit">
                {busy ? (
                  <Loader2 className="spin" size={15} />
                ) : (
                  <Check size={15} />
                )}{" "}
                {mode === "complete"
                  ? "Record completed inspection"
                  : "Save schedule"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      <Governance compact />
    </>
  );
}
export function Queries() {
  const [items, setItems] = useState<QueryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<QueryRecord[]>("/queries")
      .then(setItems)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <PageHeading
        eyebrow="QUERY MANAGEMENT"
        title="Clarifications without the confusion"
        description="A connected record of requests, applicant responses and officer review."
      />
      <div className="query-workflow">
        <span>
          01 <strong>Query raised</strong>
        </span>
        <ArrowRight size={18} />
        <span>
          02 <strong>Applicant responded</strong>
        </span>
        <ArrowRight size={18} />
        <span>
          03 <strong>Officer review</strong>
        </span>
      </div>
      {loading ? (
        <Loading />
      ) : (
        items.map((q) => (
          <Card key={q.id} className="standalone-query">
            <div className="spread">
              <Link
                className="text-link"
                href={`/officer/applications/${q.application_id}`}
              >
                {q.application_id}
                <ArrowRight size={14} />
              </Link>
              <Badge>{q.status}</Badge>
            </div>
            <h3>{q.text}</h3>
            <small className="muted">
              <Clock3 size={14} /> Response due {date(q.due_date)}
            </small>
            {q.response && (
              <div className="query-response">
                <strong>Applicant response</strong>
                <p>{q.response}</p>
              </div>
            )}
            <Link
              className="btn btn-outline btn-sm mt"
              href={`/officer/applications/${q.application_id}`}
            >
              Open application review <ArrowRight size={14} />
            </Link>
          </Card>
        ))
      )}
      {!items.length && !loading && (
        <Empty description="Raise a clarification from an application review to begin the query workflow." />
      )}
    </>
  );
}
