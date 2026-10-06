"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Download,
  FileCheck2,
  Landmark,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { Compliance, Project, Scheme, Notice } from "@/lib/types";
import { api } from "@/lib/api";
import {
  Alert,
  Badge,
  Calendar,
  Card,
  CardHeading,
  Empty,
  Governance,
  Metric,
  Modal,
  PageHeading,
  date,
} from "./shared";
import { Button } from "./ui/button";
import { toast } from "./toast";
export function CompliancePage({
  compliance,
  project,
}: {
  compliance: Compliance | null;
  project?: Project;
}) {
  return (
    <>
      <PageHeading
        eyebrow="CONTINUOUS COMPLIANCE"
        title="Ready today. Compliant tomorrow."
        description="Your approvals are the beginning. Keep licenses, renewals and obligations on track."
      >
        <Button
          variant="outline"
          onClick={() => {
            if (!compliance) return;
            const rows = [
              "License,Due date,Status",
              ...compliance.records.map(
                (r) => `${r.name},${r.due_date},${r.status}`,
              ),
            ];
            const blob = new Blob([rows.join("\n")], { type: "text/csv" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "nirman-compliance.csv";
            a.click();
            URL.revokeObjectURL(a.href);
            toast.success("Compliance schedule exported");
          }}
        >
          <Download size={15} /> Export schedule
        </Button>
      </PageHeading>
      <div className="compliance-banner">
        <div className="compliance-ring">
          <strong>
            {compliance?.score || 87}
            <small>%</small>
          </strong>
        </div>
        <div>
          <span className="eyebrow">YOUR COMPLIANCE HEALTH</span>
          <h2>Good standing. Stay ahead.</h2>
          <p>Renew on time and maintain a clear record of compliance.</p>
        </div>
        <Badge tone="green">{project?.name || "Project workspace"}</Badge>
      </div>
      <div className="metrics four">
        <Metric
          label="Active licenses"
          value={
            project?.id === "p1"
              ? 9
              : compliance?.records.filter((r) => r.status === "Active")
                  .length || 0
          }
          icon={ShieldCheck}
          detail="Across departments"
          tone="green"
        />
        <Metric
          label="Expiring soon"
          value={project?.id === "p1" ? 2 : 0}
          icon={Clock3}
          detail="Renewal preparation needed"
          tone="amber"
        />
        <Metric
          label="Overdue"
          value={0}
          icon={TriangleAlert}
          detail="No outstanding violations"
          tone="green"
        />
        <Metric
          label="Upcoming renewals"
          value={project?.id === "p1" ? 4 : compliance?.records.length || 0}
          icon={CalendarDays}
          detail="Plan the next quarter"
        />
      </div>
      {project?.id === "p1" && (
        <div className="two-alerts">
          <Alert>
            <strong>Factory License expires in 18 days.</strong>
            <p>Prepare the renewal package before 24 October 2026.</p>
          </Alert>
          <Alert kind="blue">
            <strong>Pollution Consent renewal due in 42 days.</strong>
            <p>Keep your environmental monitoring report up to date.</p>
          </Alert>
        </div>
      )}
      <div className="compliance-layout">
        <Card>
          <CardHeading
            title="Renewals & ongoing obligations"
            subtitle="Created from completed approvals and seeded obligations"
          />
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>License / obligation</th>
                  <th>Due date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {compliance?.records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.name}</strong>
                      <small>Project compliance record</small>
                    </td>
                    <td>{date(r.due_date)}</td>
                    <td>
                      <Badge>{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!compliance?.records.length && (
            <Empty
              title="Your compliance journey starts with approval"
              description="An officer-approved application creates its renewal obligation here."
              href="/app/applications"
              label="Track applications"
            />
          )}
        </Card>
        <Card>
          <CardHeading
            title="Compliance calendar"
            subtitle="October 2026 · Demo planning period"
          />
          <Calendar
            events={
              compliance?.records.map((r) => ({
                date: r.due_date,
                label: r.name,
              })) || []
            }
          />
          <div className="calendar-events">
            {compliance?.records.slice(0, 3).map((r) => (
              <div key={r.id}>
                <span className="tiny-dot blue" />
                <strong>{r.name}</strong>
                <small>{date(r.due_date)}</small>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Governance compact />
    </>
  );
}
export function Schemes({
  schemes,
  project,
}: {
  schemes: Scheme[];
  project?: Project;
}) {
  const [selected, setSelected] = useState<Scheme | null>(null);
  const [saved, setSaved] = useState<string[]>(() =>
    typeof window !== "undefined"
      ? (JSON.parse(
          localStorage.getItem("nirman-saved-schemes") || "[]",
        ) as string[])
      : [],
  );
  function save(id: string) {
    const next = saved.includes(id)
      ? saved.filter((s) => s !== id)
      : [...saved, id];
    setSaved(next);
    localStorage.setItem("nirman-saved-schemes", JSON.stringify(next));
    toast.success(
      next.includes(id)
        ? "Scheme saved to your shortlist"
        : "Scheme removed from shortlist",
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="GOVERNMENT SUPPORT DISCOVERY"
        title="Find support for your next step"
        description="Profile-matched opportunities to help your industrial project grow."
      />
      <Alert kind="blue">
        <strong>Illustrative scheme recommendations</strong>
        <p>
          This catalogue contains demonstration benefits and eligibility
          estimates. Verify actual availability and criteria with the relevant
          department before applying.
        </p>
      </Alert>
      <div className="scheme-profile">
        <Landmark size={21} />
        <span>
          Matched for{" "}
          <strong>{project?.data.industry || "your industry"}</strong> in{" "}
          <strong>{project?.data.state || "your state"}</strong> · Investment{" "}
          <strong>₹{project?.data.investment || 0} Cr</strong>
        </span>
        <Badge tone="green">{schemes.length} opportunities</Badge>
      </div>
      <div className="scheme-grid">
        {schemes.map((s, i) => (
          <Card key={s.id} className="scheme-card">
            <div className="spread">
              <span className="scheme-icon">
                <Landmark size={25} />
              </span>
              <Button
                variant="ghost"
                aria-label={
                  saved.includes(s.id) ? "Unsave scheme" : "Save scheme"
                }
                onClick={() => save(s.id)}
              >
                <Bookmark
                  size={19}
                  fill={saved.includes(s.id) ? "#2b5fa6" : "none"}
                />
              </Button>
            </div>
            <span className="eyebrow">
              {i === 0 ? "TOP RECOMMENDATION" : "PROFILE-MATCHED SUPPORT"}
            </span>
            <h2>{s.name}</h2>
            <div className="scheme-eligibility">
              <strong>
                {s.eligibility}
                <small>%</small>
              </strong>
              <span>
                eligibility match
                <br />
                <small>Demo estimate</small>
              </span>
              <div className="progress-track">
                <span style={{ width: `${s.eligibility}%` }} />
              </div>
            </div>
            <div className="scheme-benefit">
              <span>WHAT YOU COULD RECEIVE</span>
              <strong>{s.benefit}</strong>
            </div>
            <p className="scheme-reason">
              <Check size={16} /> {s.reason}
            </p>
            <div className="scheme-deadline">
              <CalendarDays size={15} /> Apply by {date(s.deadline)}
            </div>
            <button className="text-link" onClick={() => setSelected(s)}>
              Explore scheme <ArrowRight size={15} />
            </button>
          </Card>
        ))}
      </div>
      {schemes.length === 0 && (
        <Empty
          description="Create a project to see matched demonstration schemes."
          href="/app/project/new"
        />
      )}
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <Badge tone="green">{selected.eligibility}% eligibility match</Badge>
          <p className="modal-description">{selected.benefit}</p>
          <div className="why-required">
            <span>WHY RECOMMENDED</span>
            <p>{selected.reason}</p>
          </div>
          <h4 className="mt">Required documents</h4>
          <div className="document-pills">
            {selected.documents.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <dl className="detail-grid">
            <div>
              <dt>Deadline</dt>
              <dd>{date(selected.deadline)}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{selected.source}</dd>
            </div>
          </dl>
          <Alert kind="blue">
            This demo does not submit scheme applications. Benefits and matches
            are illustrative.
          </Alert>
          <div className="modal-actions">
            <Button onClick={() => save(selected.id)}>
              <Bookmark size={16} />
              {saved.includes(selected.id)
                ? "Remove from shortlist"
                : "Save to shortlist"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Notifications({
  notices,
  onChanged,
}: {
  notices: Notice[];
  onChanged: () => void;
}) {
  async function mark(n: Notice) {
    try {
      await api(`/notifications/${n.id}`, { method: "PATCH" });
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="NOTIFICATION CENTRE"
        title="The updates that move you forward"
        description="Queries, inspection updates and renewal reminders, in one place."
      />
      <div className="notifications-list">
        {notices.map((n) => (
          <Card
            key={n.id}
            className={`notification-card ${n.read ? "read" : ""}`}
          >
            <span className="notification-icon">
              {n.title.includes("Clarification") ? (
                <TriangleAlert size={21} />
              ) : n.title.includes("expires") ? (
                <CalendarDays size={21} />
              ) : (
                <FileCheck2 size={21} />
              )}
            </span>
            <div>
              <div className="spread">
                <h3>{n.title}</h3>
                {!n.read && <Badge tone="blue">New</Badge>}
              </div>
              <p>{n.text}</p>
              <Link
                href={n.link}
                className="text-link"
                onClick={() => void mark(n)}
              >
                View update <ArrowRight size={14} />
              </Link>
            </div>
            {!n.read && (
              <Button variant="ghost" size="sm" onClick={() => mark(n)}>
                Mark as read
              </Button>
            )}
          </Card>
        ))}
        {!notices.length && (
          <Empty
            title="You’re all caught up"
            description="Application and compliance updates will appear here."
          />
        )}
      </div>
    </>
  );
}
