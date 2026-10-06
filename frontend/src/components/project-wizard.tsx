"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  FileSearch,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Card, PageHeading, Alert, Governance } from "./shared";
import { Button } from "./ui/button";
import { projectService } from "@/lib/api";
import type { Project, ProjectData } from "@/lib/types";

const initial: ProjectData = {
  name: "",
  company: "",
  applicant: "Aditya Sharma",
  business_type: "Private Limited",
  contact: "",
  industry: "Manufacturing",
  sub_sector: "Chemical Manufacturing",
  project_type: "New facility",
  investment: 15,
  employees: 120,
  land: 4.2,
  state: "Maharashtra",
  district: "Pune",
  industrial_area: "Chakan MIDC",
  address: "",
  pin: "410501",
  category: "Chemical manufacturing",
  power: 500,
  water: 40,
  waste: "Industrial wastewater",
  hazardous: true,
  pollution: "Orange",
};
const steps = [
  "Basic information",
  "Industrial profile",
  "Location",
  "Operational details",
  "Review & discover",
];
type Field = {
  key: keyof ProjectData;
  label: string;
  type?: string;
  options?: string[];
  placeholder?: string;
};
const fields: Field[][] = [
  [
    {
      key: "name",
      label: "Project name",
      placeholder: "e.g. Chakan Manufacturing Unit",
    },
    {
      key: "company",
      label: "Company name",
      placeholder: "e.g. ABC Manufacturing Pvt Ltd",
    },
    { key: "applicant", label: "Applicant name" },
    {
      key: "business_type",
      label: "Business type",
      options: [
        "Private Limited",
        "Partnership",
        "Sole Proprietorship",
        "Public Limited",
      ],
    },
    {
      key: "contact",
      label: "Contact email",
      type: "email",
      placeholder: "you@company.in",
    },
  ],
  [
    {
      key: "industry",
      label: "Industry sector",
      options: ["Manufacturing", "Services", "Logistics"],
    },
    {
      key: "sub_sector",
      label: "Sub-sector",
      options: [
        "Chemical Manufacturing",
        "Food Processing",
        "Textiles",
        "Auto Components",
        "Packaging",
      ],
    },
    {
      key: "project_type",
      label: "Project type",
      options: ["New facility", "Expansion", "Modernization"],
    },
    { key: "investment", label: "Investment amount (₹ Crore)", type: "number" },
    { key: "employees", label: "Number of employees", type: "number" },
    { key: "land", label: "Land area (acres)", type: "number" },
  ],
  [
    {
      key: "state",
      label: "State",
      options: ["Maharashtra", "Gujarat", "Karnataka", "Tamil Nadu"],
    },
    { key: "district", label: "District" },
    { key: "industrial_area", label: "Industrial area" },
    {
      key: "address",
      label: "Site address",
      placeholder: "Plot number, street, industrial area",
    },
    { key: "pin", label: "PIN code" },
  ],
  [
    {
      key: "category",
      label: "Manufacturing category",
      options: [
        "Chemical manufacturing",
        "Food manufacturing",
        "Textile manufacturing",
        "General manufacturing",
      ],
    },
    { key: "power", label: "Power requirement (kVA)", type: "number" },
    { key: "water", label: "Water requirement (kL/day)", type: "number" },
    {
      key: "waste",
      label: "Waste generation",
      options: [
        "Industrial wastewater",
        "Solid waste",
        "Hazardous waste",
        "None",
      ],
    },
    {
      key: "hazardous",
      label: "Handling hazardous materials?",
      options: ["Yes", "No"],
    },
    {
      key: "pollution",
      label: "Pollution category",
      options: ["Red", "Orange", "Green", "White"],
    },
  ],
];
export function ProjectWizard({
  onCreated,
}: {
  onCreated: (project: Project) => void;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function next(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      const p = await projectService.create(data);
      onCreated(p);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="LET’S BUILD YOUR PROJECT PROFILE"
        title="A strong start for your business"
        description="Tell us about your project. We’ll map out the approvals you need."
      />
      <Card className="wizard">
        <div className="wizard-stepper">
          {steps.map((s, i) => (
            <div
              key={s}
              className={i === step ? "current" : i < step ? "done" : ""}
            >
              <span>{i < step ? <Check size={16} /> : i + 1}</span>
              <strong>{s}</strong>
            </div>
          ))}
        </div>
        <form onSubmit={next}>
          <div className="wizard-content">
            <div className="eyebrow">STEP {step + 1} OF 5</div>
            <h2>{steps[step]}</h2>
            <p className="muted">
              {
                [
                  "Start with the people and business behind your idea.",
                  "These details determine which regulatory rules apply.",
                  "Local requirements vary by state and industrial area.",
                  "Help us understand your environmental and operational footprint.",
                  "Check your profile before we discover applicable approvals.",
                ][step]
              }
            </p>
            {step < 4 ? (
              <div className="form-grid">
                {fields[step].map((f) => (
                  <label key={f.key}>
                    {f.label}
                    {f.options ? (
                      <select
                        value={
                          typeof data[f.key] === "boolean"
                            ? data[f.key]
                              ? "Yes"
                              : "No"
                            : String(data[f.key])
                        }
                        onChange={(e) =>
                          setData({
                            ...data,
                            [f.key]:
                              f.key === "hazardous"
                                ? e.target.value === "Yes"
                                : e.target.value,
                          })
                        }
                      >
                        {f.options.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required
                        type={f.type || "text"}
                        min={
                          f.type === "number"
                            ? f.key === "power" || f.key === "water"
                              ? 0
                              : 0.1
                            : undefined
                        }
                        step={
                          f.type === "number"
                            ? f.key === "employees"
                              ? 1
                              : "any"
                            : undefined
                        }
                        minLength={
                          f.key === "name" ? 3 : f.key === "pin" ? 6 : 2
                        }
                        pattern={f.key === "pin" ? "[0-9]{6}" : undefined}
                        placeholder={f.placeholder}
                        value={String(data[f.key])}
                        onChange={(e) =>
                          setData({
                            ...data,
                            [f.key]:
                              f.type === "number"
                                ? Number(e.target.value)
                                : e.target.value,
                          })
                        }
                      />
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <>
                <Alert kind="blue">
                  We’ll evaluate your profile against the demonstration rule
                  catalogue. No information is sent to government systems.
                </Alert>
                <dl className="detail-grid review-grid">
                  {Object.entries(data).map(([key, value]) => (
                    <div key={key}>
                      <dt>{key.replaceAll("_", " ")}</dt>
                      <dd>
                        {typeof value === "boolean"
                          ? value
                            ? "Yes"
                            : "No"
                          : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
            {step === 2 && (
              <div className="map-placeholder wizard-map">
                <div className="map-roads" />
                <MapPin size={32} />
                <strong>
                  {data.industrial_area}, {data.district}
                </strong>
                <small>Illustrative location placeholder</small>
              </div>
            )}
            {step === 3 && (
              <Alert kind="blue">
                <strong>Why this matters</strong>
                <p>
                  Pollution category and material handling guide the
                  environmental approval checklist and explainable risk
                  assessment.
                </p>
              </Alert>
            )}
            {error && <Alert kind="red">{error}</Alert>}
          </div>
          <div className="wizard-footer">
            <div>
              <ShieldCheck size={15} /> Your profile is saved when you discover
              approvals.
            </div>
            <div>
              {step > 0 && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setStep(step - 1)}
                  disabled={busy}
                >
                  <ArrowLeft size={16} /> Back
                </Button>
              )}
              <Button disabled={busy} type="submit">
                {busy ? (
                  <Loader2 className="spin" size={17} />
                ) : step === 4 ? (
                  <FileSearch size={17} />
                ) : null}
                {step === 4 ? "Discover Required Approvals" : "Continue"}
                {step < 4 && <ArrowRight size={16} />}
              </Button>
            </div>
          </div>
        </form>
      </Card>
      <Governance />
    </>
  );
}
