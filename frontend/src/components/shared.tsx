"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  CircleCheck,
  CircleHelp,
  Loader2,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("logo", light && "logo-light")}
      aria-label="NIRMAN home"
    >
      <span className="logo-symbol">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>
        NIRMAN<small>BUILD WITH CONFIDENCE</small>
      </span>
    </Link>
  );
}
export function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  const s = String(children).toLowerCase();
  const color =
    tone ||
    (["approved", "verified", "completed", "active", "low", "success"].some(
      (v) => s.includes(v),
    )
      ? "green"
      : ["action required", "high", "rejected", "missing"].some((v) =>
            s.includes(v),
          )
        ? "red"
        : ["warning", "medium", "query raised", "upcoming", "inspection"].some(
              (v) => s.includes(v),
            )
          ? "amber"
          : "blue");
  return (
    <span className={`badge badge-${color}`}>
      <span />
      {children}
    </span>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function CardHeading({
  title,
  subtitle,
  href,
  action,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card-heading">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {href ? (
        <Link className="text-link" href={href}>
          View all <ChevronRight size={14} />
        </Link>
      ) : (
        action
      )}
    </div>
  );
}
export function PageHeading({
  eyebrow = "PROJECT WORKSPACE",
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function Metric({
  label,
  value,
  icon: Icon,
  detail,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  detail: string;
  tone?: string;
}) {
  return (
    <Card className="metric">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon ${tone}`}>
          <Icon size={17} />
        </span>
      </div>
      <strong>{value}</strong>
      <small>
        {detail.includes("+") ? (
          <ArrowUpRight size={13} />
        ) : (
          <span className={`tiny-dot ${tone}`} />
        )}{" "}
        {detail}
      </small>
    </Card>
  );
}
export function Loading({
  label = "Loading your workspace…",
}: {
  label?: string;
}) {
  return (
    <div className="loading">
      <Loader2 className="spin" size={26} />
      <p>{label}</p>
    </div>
  );
}
export function Empty({
  title = "Nothing here yet",
  description,
  href,
  label = "Get started",
}: {
  title?: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <CircleHelp size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
      {href && (
        <Link className="btn btn-primary" href={href}>
          {label}
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function Governance({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "governance compact" : "governance"}>
      <ShieldCheck size={18} />
      <div>
        <strong>
          AI recommends <span>·</span> Rules validate <span>·</span> Officers
          decide
        </strong>
        {!compact && (
          <p>
            AI provides recommendations and explanations. Final regulatory
            decisions remain with authorized officials.
          </p>
        )}
      </div>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const selectable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
        ) || [],
      );
    selectable()[0]?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab") return;
      const nodes = selectable(),
        first = nodes[0],
        last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title">
          <h2>{title}</h2>
          <Button variant="ghost" aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function Alert({
  children,
  kind = "amber",
}: {
  children: React.ReactNode;
  kind?: string;
}) {
  return (
    <div className={`alert alert-${kind}`}>
      {kind === "green" ? (
        <CircleCheck size={18} />
      ) : (
        <TriangleAlert size={18} />
      )}
      <div>{children}</div>
    </div>
  );
}
export function Calendar({
  mini = false,
  events = [],
}: {
  mini?: boolean;
  events?: { date: string; label: string }[];
}) {
  const [month, setMonth] = useState(9);
  const [selected, setSelected] = useState<number | null>(null);
  const current = new Date(2026, month, 1);
  const year = current.getFullYear(),
    actualMonth = current.getMonth();
  const total = new Date(year, actualMonth + 1, 0).getDate();
  const leading = (current.getDay() + 6) % 7;
  const previousLast = new Date(year, actualMonth, 0).getDate();
  const relevant = events.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === actualMonth;
  });
  const labels = (day: number) =>
    relevant
      .filter((e) => new Date(e.date).getDate() === day)
      .map((e) => e.label);
  return (
    <div className={mini ? "calendar mini" : "calendar"}>
      <div className="calendar-title">
        <strong>
          {current.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })}
        </strong>
        <div className="calendar-nav">
          <button
            aria-label="Previous month"
            onClick={() => {
              setMonth(month - 1);
              setSelected(null);
            }}
          >
            <ChevronLeft size={13} />
          </button>
          <button
            aria-label="Next month"
            onClick={() => {
              setMonth(month + 1);
              setSelected(null);
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span className="day-label" key={`w${i}`}>
            {d}
          </span>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <span className="outside" key={`p${i}`}>
            {previousLast - leading + i + 1}
          </span>
        ))}
        {Array.from({ length: total }, (_, i) => i + 1).map((day) => {
          const marked = labels(day);
          return (
            <button
              key={day}
              aria-label={`${day} ${current.toLocaleDateString("en", { month: "long" })}${marked.length ? ": " + marked.join(", ") : ""}`}
              title={marked.join(" · ")}
              onClick={() => setSelected(day)}
              className={cn(
                year === 2026 && actualMonth === 9 && day === 6 && "today",
                marked.length > 0 && "event-day",
                day === selected && "calendar-selected",
              )}
            >
              {day}
              {marked.length > 0 && <i />}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="calendar-selection">
          <strong>
            {selected} {current.toLocaleDateString("en", { month: "short" })}
          </strong>
          <p>
            {labels(selected).join(" · ") ||
              "No deadlines or inspections scheduled."}
          </p>
        </div>
      )}
      {!mini && (
        <div className="calendar-legend">
          <span>
            <i className="tiny-dot blue" /> Scheduled obligation
          </span>
          <span>
            <i className="tiny-dot green" /> Demo today
          </span>
        </div>
      )}
    </div>
  );
}
export function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
