"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  GitBranch,
  Landmark,
  Loader2,
  Network,
  ShieldCheck,
  Sparkles,
  UserRound,
  CalendarDays,
  BookOpen,
  CircleCheck,
  ArrowUpRight,
} from "lucide-react";
import { Logo, Governance, Alert } from "./shared";
import { Button } from "./ui/button";
import { api } from "@/lib/api";
import type { User, Role } from "@/lib/types";

const features = [
  {
    icon: Network,
    title: "Intelligent approval discovery",
    text: "Know exactly which approvals your project needs, and why.",
  },
  {
    icon: FileCheck2,
    title: "AI document intelligence",
    text: "Catch missing information and inconsistencies before submission.",
  },
  {
    icon: GitBranch,
    title: "Approval dependency graph",
    text: "Understand the sequence. Move parallel approvals forward.",
  },
  {
    icon: ShieldCheck,
    title: "Risk-based scrutiny",
    text: "Explainable recommendations, with officials in control.",
  },
  {
    icon: CalendarDays,
    title: "Continuous compliance",
    text: "Stay ahead of license renewals and statutory deadlines.",
  },
  {
    icon: Landmark,
    title: "Government support, discovered",
    text: "Find schemes aligned with your industry and investment.",
  },
  {
    icon: BookOpen,
    title: "Regulatory knowledge engine",
    text: "Trace every recommendation to a clear demonstration rule.",
  },
  {
    icon: UserRound,
    title: "Human-in-the-loop governance",
    text: "Authorized officers retain every final regulatory decision.",
  },
];
export function Landing() {
  return (
    <div className="landing">
      <div className="public-top">
        <span>SMART INDIA HACKATHON 2026</span>
        <span>
          SIH26130 <i /> Prototype / Demonstration Environment
        </span>
      </div>
      <header className="public-nav">
        <Logo />
        <nav>
          <a href="#how-it-works">How it works</a>
          <a href="#features">Platform capabilities</a>
          <Link href="/login">Sign in</Link>
          <Link className="btn btn-primary" href="/login">
            Launch Interactive Demo <ArrowUpRight size={16} />
          </Link>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-dot green" /> A CLEARER PATH TO INDUSTRIAL
              GROWTH
            </div>
            <h1>
              Your ambition.
              <br />
              Our orchestration.
              <br />
              <span>India’s progress.</span>
            </h1>
            <h2>
              AI-Powered Industrial Approval &amp;
              <br />
              Compliance Orchestrator
            </h2>
            <p>
              From Business Idea to Compliant Operations —<br />
              <strong>Faster, Simpler, Smarter.</strong>
            </p>
            <div className="hero-ctas">
              <Link href="/login" className="btn btn-primary">
                Start a Project <ArrowRight size={17} />
              </Link>
              <Link href="/login" className="btn btn-outline">
                View Demo <ChevronRight size={17} />
              </Link>
            </div>
            <div className="hero-trust">
              <ShieldCheck size={16} /> Explainable AI <span /> Human-led
              decisions <span /> One connected journey
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-label">
              <span className="tiny-dot green" /> YOUR PROJECT, MOVING FORWARD{" "}
              <span className="badge badge-blue">LIVE DEMO</span>
            </div>
            <div className="hero-project">
              <span className="large-icon">
                <Building2 size={27} />
              </span>
              <div>
                <h3>Chakan Manufacturing Unit</h3>
                <p>Maharashtra · Manufacturing · ₹15 Cr</p>
              </div>
              <CircleCheck size={22} className="green-text" />
            </div>
            <div className="hero-visual-stats">
              <div>
                <strong>12</strong>
                <span>Approvals identified</span>
              </div>
              <div>
                <strong>
                  87<span>%</span>
                </strong>
                <span>Compliance score</span>
              </div>
              <div>
                <strong>
                  42<span> days</span>
                </strong>
                <span>Critical path estimate</span>
              </div>
            </div>
            <div className="hero-path">
              {[
                ["Project profile", "Complete"],
                ["Approval discovery", "12 rules matched"],
                ["Document intelligence", "92% consistency"],
                ["Officer review", "Human decision required"],
              ].map(([name, desc], i) => (
                <div key={name}>
                  <span className={i < 3 ? "path-done" : "path-current"}>
                    {i < 3 ? <Check size={15} /> : <UserRound size={15} />}
                  </span>
                  <div>
                    <strong>{name}</strong>
                    <small>{desc}</small>
                  </div>
                  {i < 3 ? (
                    <BadgeDone />
                  ) : (
                    <span className="badge badge-amber">In progress</span>
                  )}
                </div>
              ))}
            </div>
            <div className="hero-ai">
              <Sparkles size={19} />
              <p>
                <strong>Less uncertainty. More momentum.</strong>
                <br />
                Every next step, explained and connected.
              </p>
            </div>
            <div className="visual-caption">
              ILLUSTRATIVE PROJECT DATA · NO GOVERNMENT CONNECTIONS
            </div>
          </div>
        </section>
        <section className="landing-workflow" id="how-it-works">
          <div>
            <span className="eyebrow">ONE PROJECT. ONE CONNECTED JOURNEY.</span>
            <h2>From the first idea to the next renewal.</h2>
          </div>
          <div className="workflow-steps">
            {[
              "Project Details",
              "Approval Discovery",
              "Document Validation",
              "Application Tracking",
              "Officer Review",
              "Compliance",
            ].map((v, i) => (
              <div key={v}>
                <span>0{i + 1}</span>
                <strong>{v}</strong>
                {i < 5 && <ArrowRight size={16} />}
              </div>
            ))}
          </div>
        </section>
        <section className="landing-features" id="features">
          <div className="section-intro">
            <div>
              <span className="eyebrow">
                PURPOSE-BUILT FOR INDUSTRIAL APPROVALS
              </span>
              <h2>Clarity at every checkpoint.</h2>
            </div>
            <p>
              A single orchestration layer for entrepreneurs,
              <br />
              departments, and the decisions that connect them.
            </p>
          </div>
          <div className="feature-grid">
            {features.map((f) => (
              <div key={f.title}>
                <span className="feature-icon">
                  <f.icon size={24} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="landing-bottom">
          <div>
            <h2>
              Build your business.
              <br />
              We’ll help you navigate the process.
            </h2>
            <p>
              A working demonstration for a more connected industrial ecosystem.
            </p>
          </div>
          <Link className="btn btn-white" href="/login">
            Launch Interactive Demo <ArrowRight size={17} />
          </Link>
        </section>
        <Governance />
      </main>
      <footer className="public-footer">
        <Logo />
        <p>SIH 2026 · Problem Statement SIH26130</p>
        <span>Built for demonstration. Designed for possibility.</span>
      </footer>
    </div>
  );
}
function BadgeDone() {
  return <span className="badge badge-green">Complete</span>;
}
export function Login({
  onLogin,
  register = false,
}: {
  onLogin: (token: string, user: User) => void;
  register?: boolean;
}) {
  const [role, setRole] = useState<Role>("entrepreneur");
  const [email, setEmail] = useState("entrepreneur@nirman.demo");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ token: string; user: User }>(
        register ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(register ? { email, name } : { email }),
        },
      );
      onLogin(result.token, result.user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Logo light />
        <div>
          <span className="eyebrow">INDUSTRIAL PROGRESS, ORCHESTRATED.</span>
          <h1>
            One clear path.
            <br />
            Countless
            <br />
            <span>possibilities.</span>
          </h1>
          <p>
            Turn a complex approval process into a connected, understandable
            journey.
          </p>
          <div className="auth-principles">
            {[
              "Intelligent discovery, grounded in rules",
              "Documents checked before they hold you back",
              "Human decisions, supported by explainable AI",
            ].map((t) => (
              <p key={t}>
                <CircleCheck size={19} />
                {t}
              </p>
            ))}
          </div>
        </div>
        <small>SMART INDIA HACKATHON 2026 · SIH26130</small>
      </aside>
      <main className="auth-main">
        <Link href="/" className="back-link">
          ← Back to NIRMAN
        </Link>
        <div className="auth-form">
          <span className="badge badge-amber">
            Prototype / Demonstration Environment
          </span>
          <h1>{register ? "Begin your journey." : "Welcome to NIRMAN."}</h1>
          <p>
            {register
              ? "Create your applicant profile to start a project."
              : "Choose a role to explore the connected demo."}
          </p>
          {!register && (
            <div className="role-tabs">
              {(
                [
                  ["entrepreneur", Building2, "Applicant"],
                  ["officer", UserRound, "Officer"],
                  ["admin", ShieldCheck, "Admin"],
                ] as const
              ).map(([r, Icon, label]) => (
                <button
                  className={role === r ? "selected" : ""}
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setEmail(`${r}@nirman.demo`);
                  }}
                >
                  <Icon size={19} />
                  {label}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={submit}>
            {register && (
              <label>
                Full name
                <input
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {!register && (
              <div className="demo-login-note">
                <ShieldCheck size={17} />
                <p>
                  No password needed. These accounts access seeded demo data
                  only.
                </p>
              </div>
            )}
            {error && <Alert kind="red">{error}</Alert>}
            <Button disabled={busy} type="submit" className="w-full">
              {busy ? (
                <Loader2 size={17} className="spin" />
              ) : (
                <ArrowRight size={17} />
              )}{" "}
              {register
                ? "Create applicant account"
                : `Enter ${role === "entrepreneur" ? "applicant" : role} workspace`}
            </Button>
          </form>
          <p className="auth-switch">
            {register
              ? "Already have an account?"
              : "Want to try your own project?"}{" "}
            <Link href={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Register as an applicant"}
            </Link>
          </p>
          <Governance />
        </div>
        <div className="auth-footer">
          Demonstration data · No real government submissions
        </div>
      </main>
    </div>
  );
}
