"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleCheck,
  FileCheck2,
  FileText,
  Loader2,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { documentService } from "@/lib/api";
import type { DocumentRecord, Project, Validation } from "@/lib/types";
import { toast } from "./toast";
import {
  Alert,
  Badge,
  Card,
  CardHeading,
  Empty,
  Governance,
  Loading,
  PageHeading,
  date,
} from "./shared";
import { Button } from "./ui/button";
export const categories = [
  "PAN",
  "GST Certificate",
  "Land Ownership Document",
  "Project Report",
  "Environmental Report",
  "Fire Safety Plan",
  "Pollution Control Document",
];
export function Documents({
  project,
  onChanged,
}: {
  project?: Project;
  onChanged: () => void;
}) {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [category, setCategory] = useState("Project Report");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);
  const [selected, setSelected] = useState<DocumentRecord | null>(null);
  const [result, setResult] = useState<Validation | null>(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  async function load() {
    if (!project) {
      setLoading(false);
      return;
    }
    try {
      setDocs(await documentService.list(project.id));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    setSelected(null);
    setResult(null);
    void load();
  }, [project?.id]);
  async function upload(file: File) {
    if (!project) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("project_id", project.id);
      form.append("category", category);
      form.append("file", file);
      const d = await documentService.upload(form);
      setSelected(d);
      setResult(null);
      toast.success(`${file.name} uploaded. Ready for analysis.`);
      await load();
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function validate(d: DocumentRecord) {
    setValidating(d.id);
    setSelected(d);
    try {
      const r = await documentService.validate(d.id);
      setResult(r);
      toast.success("Document analysis completed");
      await load();
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setValidating(null);
    }
  }
  if (!project)
    return (
      <Empty
        description="Create a project to prepare your document checklist."
        href="/app/project/new"
      />
    );
  return (
    <>
      <PageHeading
        eyebrow="AI DOCUMENT INTELLIGENCE"
        title="Good documents. Fewer delays."
        description="Upload, validate, and resolve inconsistencies before your application moves forward."
      >
        <Link href="/app/approvals" className="btn btn-primary">
          Continue to approvals <ArrowRight size={16} />
        </Link>
      </PageHeading>
      <div className="document-stats">
        <span>
          <strong>{docs.length}</strong> documents uploaded
        </span>
        <span>
          <CircleCheck size={16} className="green-text" />{" "}
          {docs.filter((d) => d.status === "Verified").length} verified
        </span>
        <span>
          <TriangleAlert size={16} className="amber-text" />{" "}
          {docs.filter((d) => d.status === "Warning").length} need review
        </span>
        <span>
          <ShieldCheck size={16} /> Secure demo storage
        </span>
      </div>
      {error && (
        <Alert kind="red">
          {error}
          <Button variant="outline" onClick={load}>
            Retry
          </Button>
        </Alert>
      )}
      <div className="document-layout">
        <div>
          <Card>
            <CardHeading
              title="Required document checklist"
              subtitle="Based on your industrial profile"
            />
            <div className="checklist">
              {categories.map((c) => {
                const d = docs.filter((d) => d.category === c).at(-1);
                return (
                  <button
                    key={c}
                    className={category === c ? "selected" : ""}
                    onClick={() => {
                      setCategory(c);
                      if (d) {
                        setSelected(d);
                        setResult(d.validation);
                      } else {
                        setSelected(null);
                        setResult(null);
                      }
                    }}
                  >
                    <span
                      className={
                        d
                          ? d.status === "Warning"
                            ? "amber-text"
                            : "green-text"
                          : "muted"
                      }
                    >
                      {d ? (
                        d.status === "Warning" ? (
                          <TriangleAlert size={17} />
                        ) : (
                          <CircleCheck size={17} />
                        )
                      ) : (
                        <X size={17} />
                      )}
                    </span>
                    <div>
                      <strong>{c}</strong>
                      <small>{d ? d.name : "Not uploaded yet"}</small>
                    </div>
                    <Badge
                      tone={
                        !d ? "gray" : d.status === "Warning" ? "amber" : "green"
                      }
                    >
                      {d?.status || "Missing"}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </Card>
          <Card className="mt">
            <CardHeading title="Upload a document" />
            <div className="upload-category">
              <label>
                Document category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload document"
              className={`dropzone ${drag ? "drag" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                const f = e.dataTransfer.files[0];
                if (f && !uploading) void upload(f);
              }}
              onClick={() => {
                if (!uploading) fileRef.current?.click();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  fileRef.current?.click();
              }}
            >
              {uploading ? (
                <Loader2 className="spin" size={28} />
              ) : (
                <Upload size={28} />
              )}
              <strong>
                {uploading
                  ? "Uploading document…"
                  : "Drag a file here, or click to browse"}
              </strong>
              <small>PDF, PNG, JPG · Maximum file size 10 MB</small>
              <span className="btn btn-outline btn-sm">Choose file</span>
            </div>
            <input
              ref={fileRef}
              className="sr-only"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
            />
          </Card>
          <Card className="mt">
            <CardHeading
              title="Document library"
              subtitle="Uploads remain available across role switches"
            />
            {loading ? (
              <Loading />
            ) : (
              <div className="document-library">
                {docs.map((d) => (
                  <div key={d.id}>
                    <FileText size={18} />
                    <div>
                      <strong>{d.name}</strong>
                      <small>{d.category}</small>
                    </div>
                    <Badge>{d.status}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => validate(d)}
                      disabled={validating !== null}
                    >
                      {validating === d.id ? (
                        <Loader2 size={14} className="spin" />
                      ) : (
                        <ScanLine size={14} />
                      )}{" "}
                      Validate
                    </Button>
                  </div>
                ))}
                {!docs.length && (
                  <Empty description="Upload your first PDF or image to start document validation." />
                )}
              </div>
            )}
          </Card>
        </div>
        <Card className="validation-panel">
          <CardHeading
            title="AI document analysis"
            subtitle="Rules validate. AI explains."
            action={<Sparkles size={19} className="blue-text" />}
          />
          {selected ? (
            <>
              <div className="selected-document">
                <span className="large-icon">
                  <FileCheck2 size={24} />
                </span>
                <div>
                  <strong>{selected.name}</strong>
                  <small>{selected.category}</small>
                </div>
                <Button
                  size="sm"
                  onClick={() => validate(selected)}
                  disabled={validating !== null}
                >
                  {validating ? (
                    <Loader2 size={15} className="spin" />
                  ) : (
                    <ScanLine size={15} />
                  )}{" "}
                  Analyze
                </Button>
              </div>
              {result ? (
                <>
                  <div className="ocr-fixture-note">
                    Mock OCR fallback · Illustrative extracted values
                  </div>
                  <div className="analysis-section">
                    <span className="eyebrow">EXTRACTED INFORMATION</span>
                    <dl className="extracted-grid">
                      {[
                        "company",
                        "investment",
                        "land",
                        "employees",
                        "industry",
                      ].map((key) => (
                        <div key={key}>
                          <dt>{key}</dt>
                          <dd>
                            {key === "investment" ? "₹" : ""}
                            {result.extracted[key]}
                            {key === "investment"
                              ? " Crore"
                              : key === "land"
                                ? " Acres"
                                : ""}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="analysis-section">
                    <span className="eyebrow">PROFILE CONSISTENCY CHECK</span>
                    {result.checks.map((c) => (
                      <div
                        className={`validation-check ${c.matches ? "" : "warning"}`}
                        key={c.field}
                      >
                        {c.matches ? (
                          <CircleCheck size={17} />
                        ) : (
                          <TriangleAlert size={17} />
                        )}
                        <div>
                          <strong>
                            {c.field[0].toUpperCase() + c.field.slice(1)}{" "}
                            {c.matches
                              ? "matches"
                              : "differs from project profile"}
                          </strong>
                          {!c.matches && (
                            <small>
                              Document: {c.extracted} · Profile: {c.profile}
                            </small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {result.warning && (
                    <Alert>
                      <strong>Inconsistency detected</strong>
                      <p>{result.warning}</p>
                      <small>
                        The fixture uses 100 employees to demonstrate
                        cross-document validation.
                      </small>
                    </Alert>
                  )}
                  <div className="consistency-score">
                    <div>
                      <span>Consistency score</span>
                      <strong>
                        {result.score}
                        <small>%</small>
                      </strong>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${result.score}%` }} />
                    </div>
                    <small>
                      Human review recommended for any flagged fields.
                    </small>
                  </div>
                  <Governance compact />
                </>
              ) : (
                <div className="empty">
                  <ScanLine size={32} />
                  <h3>Ready for a closer look</h3>
                  <p>
                    Run analysis to compare this document’s demo extraction
                    against your project profile.
                  </p>
                  <Button
                    onClick={() => validate(selected)}
                    disabled={validating !== null}
                  >
                    Run document validation
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="empty">
              <div className="analysis-orbit">
                <ScanLine size={32} />
              </div>
              <h3>Your documents, understood.</h3>
              <p>
                Select a document or upload a project report to see extracted
                fields, consistency checks, and actionable warnings.
              </p>
              <small className="muted">
                No OCR provider or API key required.
              </small>
            </div>
          )}
        </Card>
      </div>
      <Governance />
    </>
  );
}
