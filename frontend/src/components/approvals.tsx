"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  FileSearch,
  GitBranch,
  LayoutGrid,
  Loader2,
  Network,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "./toast";
import { approvalService, applicationService } from "@/lib/api";
import type { Approval, Discovery, Project, Application } from "@/lib/types";
import {
  Badge,
  Card,
  Empty,
  Governance,
  Loading,
  Modal,
  PageHeading,
  Alert,
} from "./shared";
import { Button } from "./ui/button";
const Graph = dynamic(() => import("./approval-graph"), {
  ssr: false,
  loading: () => <Loading label="Loading approval dependency graph…" />,
});
export function Approvals({
  project,
  applications,
  onSubmitted,
  initialGraph = false,
  selectedId,
}: {
  project?: Project;
  applications: Application[];
  onSubmitted: () => void;
  initialGraph?: boolean;
  selectedId?: string;
}) {
  const [discovery, setDiscovery] = useState<Discovery | null>(null);
  const [view, setView] = useState(initialGraph ? "graph" : "list");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Approval | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  async function discover() {
    if (!project) return;
    setBusy(true);
    setError("");
    try {
      const result = await approvalService.discover(project.id);
      result.approvals = result.approvals.map((a) => ({
        ...a,
        status:
          applications.find(
            (app) => app.project_id === project.id && app.approval_id === a.id,
          )?.status ||
          project.approval_statuses[a.id] ||
          "Required",
      }));
      setDiscovery(result);
      if (selectedId)
        setSelected(result.approvals.find((a) => a.id === selectedId) || null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void discover(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project?.id]);
  async function submit(a: Approval) {
    if (!project) return;
    setSubmitting(true);
    try {
      const result = await applicationService.submit(project.id, a.id);
      toast.success(`Application ${result.id} submitted for officer review`);
      onSubmitted();
      setSelected(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }
  if (!project)
    return (
      <Empty
        title="A profile makes discovery possible"
        description="Create a project so we can match approvals to your business."
        href="/app/project/new"
      />
    );
  return (
    <>
      <PageHeading
        eyebrow="REGULATORY KNOWLEDGE ENGINE"
        title="Your approval roadmap"
        description="The right approvals, in the right order — with every requirement explained."
      >
        <Button variant="outline" onClick={discover} disabled={busy}>
          <RefreshCw size={15} className={busy ? "spin" : ""} /> Re-analyze
          profile
        </Button>
        <Link href="/app/documents" className="btn btn-primary">
          Prepare documents <ArrowRight size={15} />
        </Link>
      </PageHeading>
      {error && (
        <Alert kind="red">
          {error}
          <Button variant="outline" onClick={discover}>
            Retry
          </Button>
        </Alert>
      )}
      {busy ? (
        <Card>
          <div className="analysis-loading">
            <div className="analysis-orbit">
              <FileSearch size={32} />
            </div>
            <h2>Analyzing project requirements…</h2>
            <p>
              Matching your industrial profile with demonstration regulatory
              rules.
            </p>
            <div>
              <span>
                <Check size={15} /> Project profile
              </span>
              <span>
                <Loader2 size={15} className="spin" /> Regulatory applicability
              </span>
              <span>Approval dependencies</span>
            </div>
          </div>
        </Card>
      ) : (
        discovery && (
          <>
            <div className="discovery-summary">
              <span className="discovery-icon">
                <FileSearch size={25} />
              </span>
              <div>
                <h2>{discovery.approvals.length} applicable approvals found</h2>
                <p>
                  {project.data.industry} · {project.data.state} ·{" "}
                  {project.data.employees} employees · ₹
                  {project.data.investment} Cr investment
                </p>
              </div>
              <Badge tone="green">Rule-based discovery</Badge>
            </div>
            <div className="page-toolbar">
              <div className="segmented">
                <button
                  className={view === "list" ? "active" : ""}
                  onClick={() => setView("list")}
                >
                  <LayoutGrid size={16} /> Approval list
                </button>
                <button
                  className={view === "graph" ? "active" : ""}
                  onClick={() => setView("graph")}
                >
                  <GitBranch size={16} /> Dependency graph
                </button>
              </div>
              <span className="muted small">
                <ShieldCheck size={14} /> Demonstration rule catalogue · 5
                departments
              </span>
            </div>
            {view === "graph" ? (
              <>
                <div className="graph-stats">
                  <Card>
                    <span className="eyebrow">CRITICAL PATH</span>
                    <strong>
                      {discovery.critical_path_days} <small>days</small>
                    </strong>
                    <p>Estimated minimum completion · demo estimate</p>
                  </Card>
                  <Card>
                    <span className="eyebrow">PARALLELIZABLE APPROVALS</span>
                    <strong>
                      {discovery.parallelizable} <small>approvals</small>
                    </strong>
                    <p>Progress independently after registration</p>
                  </Card>
                  <Card>
                    <span className="eyebrow">CONNECTED BY DESIGN</span>
                    <p>
                      Zoom, pan, and select an approval to inspect its
                      requirements.
                    </p>
                  </Card>
                </div>
                <Card>
                  <Graph discovery={discovery} onSelect={setSelected} />
                </Card>
              </>
            ) : (
              <div className="approval-grid">
                {discovery.approvals.map((a, i) => {
                  const existing = applications.find(
                    (app) =>
                      app.project_id === project.id && app.approval_id === a.id,
                  );
                  return (
                    <Card key={a.id} className="approval-card">
                      <div className="spread">
                        <span className="approval-number">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <Badge tone={a.priority === "High" ? "amber" : "blue"}>
                          {a.priority} priority
                        </Badge>
                      </div>
                      <h3>{a.name}</h3>
                      <p>
                        {
                          (
                            {
                              d1: "Maharashtra Pollution Control Board",
                              d2: "Directorate of Industrial Safety",
                              d3: "Fire Department",
                              d4: "Labour Department",
                              d5: "Local Authority",
                            } as Record<string, string>
                          )[a.department_id]
                        }
                      </p>
                      <div className="approval-meta">
                        <span>
                          <Clock3 size={14} /> {a.sla} day SLA
                        </span>
                        <Badge>{existing?.status || "Required"}</Badge>
                      </div>
                      <div className="why-required">
                        <span>WHY REQUIRED?</span>
                        <p>{a.reasons?.join(" · ")}</p>
                        <small>
                          Matches your project’s industry, location and
                          operational profile.
                        </small>
                      </div>
                      <button
                        className="text-link"
                        onClick={() => setSelected(a)}
                      >
                        View requirements <ArrowRight size={15} />
                      </button>
                    </Card>
                  );
                })}
              </div>
            )}
            {discovery.approvals.length === 0 && (
              <Empty
                title="No enabled rules matched"
                description="Check your profile or ask an administrator to review the rule catalogue."
              />
            )}
            <Governance />
          </>
        )
      )}
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <Badge tone="blue">Required approval</Badge>
          <p className="modal-description">{selected.description}</p>
          <dl className="detail-grid">
            <div>
              <dt>Estimated SLA</dt>
              <dd>{selected.sla} days</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{selected.priority}</dd>
            </div>
          </dl>
          <div className="why-required">
            <span>WHY REQUIRED?</span>
            <p>{selected.reasons?.join(" · ")}</p>
            <small>
              Industry = {project.data.industry}
              <br />
              Location = {project.data.state}
              <br />
              Employees = {project.data.employees}
              <br />
              Investment = ₹{project.data.investment} Crore
            </small>
          </div>
          <Alert kind="blue">
            <strong>Source: NIRMAN demonstration regulatory rule set</strong>
            <p>
              This is an illustrative recommendation, not a verified legal
              determination.
            </p>
          </Alert>
          <h4 className="mt">Required documents</h4>
          <div className="document-pills">
            {[
              "PAN",
              "GST Certificate",
              "Land Ownership Document",
              "Project Report",
              "Environmental Report",
              "Fire Safety Plan",
              "Pollution Control Document",
            ].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="modal-actions">
            <Link
              href="/app/documents"
              className="btn btn-outline"
              onClick={() => setSelected(null)}
            >
              Manage documents
            </Link>
            {applications.find(
              (a) =>
                a.project_id === project.id && a.approval_id === selected.id,
            ) ? (
              <Link
                href={`/app/applications/${applications.find((a) => a.project_id === project.id && a.approval_id === selected.id)?.id}`}
                className="btn btn-primary"
              >
                Track application <ArrowRight size={15} />
              </Link>
            ) : (
              <Button disabled={submitting} onClick={() => submit(selected)}>
                {submitting ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <ArrowRight size={16} />
                )}{" "}
                Submit demo application
              </Button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
