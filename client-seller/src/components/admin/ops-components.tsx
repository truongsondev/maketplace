import type { LucideIcon } from "lucide-react";
import { Activity, AlertTriangle, CheckCircle2, CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

export type OpsTone = "neutral" | "good" | "warning" | "danger" | "info";

const toneClasses: Record<OpsTone, string> = {
  neutral: "border-slate-200 bg-white text-slate-900",
  good: "border-emerald-200 bg-emerald-50 text-emerald-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  danger: "border-rose-200 bg-rose-50 text-rose-950",
  info: "border-cyan-200 bg-cyan-50 text-cyan-950",
};

const toneAccentClasses: Record<OpsTone, string> = {
  neutral: "bg-slate-900",
  good: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-cyan-500",
};

const toneTextClasses: Record<OpsTone, string> = {
  neutral: "text-slate-500",
  good: "text-emerald-700",
  warning: "text-amber-700",
  danger: "text-rose-700",
  info: "text-cyan-700",
};

export function AdminPageShell({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-375 animate-in fade-in slide-in-from-bottom-2 flex-col gap-6 duration-500 motion-reduce:animate-none">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,#ecfeff_0,#ffffff_34%,#f8fafc_100%)] px-6 py-6 shadow-sm">
        <div className="absolute right-8 top-6 hidden h-24 w-24 rounded-full bg-cyan-200/30 blur-2xl lg:block" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 lg:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
          {action ? <div className="relative shrink-0">{action}</div> : null}
        </div>
      </section>
      {children}
    </div>
  );
}

export function OpsCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none ${className}`}
    >
      {children}
    </section>
  );
}

export function LivePill({ label = "Đang trực tuyến" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      {label}
    </span>
  );
}

export function Sparkline({
  values,
  tone = "info",
  height = 44,
}: {
  values: number[];
  tone?: OpsTone;
  height?: number;
}) {
  const width = 160;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = Math.max(1, max - min);
  const path = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const stroke =
    tone === "danger"
      ? "#e11d48"
      : tone === "warning"
        ? "#d97706"
        : tone === "good"
          ? "#059669"
          : "#0891b2";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-11 w-full">
      <path d={path} fill="none" stroke={stroke} strokeWidth="2.5" />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  helper,
  status = "neutral",
  values = [],
  onClick,
}: {
  label: string;
  value: string;
  delta: string;
  helper: string;
  status?: OpsTone;
  values?: number[];
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-3xl border bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none ${toneClasses[status]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${toneTextClasses[status]} bg-white/70 ring-1 ring-current/10`}
        >
          {delta}
        </span>
      </div>
      <div className="mt-4">
        {values.length > 1 ? (
          <Sparkline values={values} tone={status} />
        ) : (
          <div className="h-11 rounded-2xl bg-slate-100" />
        )}
      </div>
      <p className="mt-3 text-sm text-slate-600">{helper}</p>
    </button>
  );
}

export function AlertItem({
  title,
  description,
  action,
  tone,
  icon: Icon,
  onClick,
}: {
  title: string;
  description: string;
  action: string;
  tone: OpsTone;
  icon?: LucideIcon;
  onClick?: () => void;
}) {
  const ResolvedIcon =
    Icon ?? (tone === "danger" ? CircleAlert : tone === "warning" ? AlertTriangle : CheckCircle2);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm motion-reduce:transition-none ${toneClasses[tone]}`}
    >
      <span className={`mt-1 rounded-2xl p-2 text-white ${toneAccentClasses[tone]}`}>
        <ResolvedIcon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-600">
          {description}
        </span>
        <span className={`mt-3 inline-flex text-xs font-bold ${toneTextClasses[tone]}`}>
          {action}
        </span>
      </span>
    </button>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function InsightCard({
  priority,
  title,
  description,
  metric,
  tone = "info",
}: {
  priority: string;
  title: string;
  description: string;
  metric: string;
  tone?: OpsTone;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-bold uppercase tracking-[0.16em] ${toneTextClasses[tone]}`}>
          {priority}
        </span>
        <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-900/5">
          {metric}
        </span>
      </div>
      <p className="mt-3 text-sm font-bold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-5 text-slate-600">{description}</p>
    </div>
  );
}

export function MetricBar({
  label,
  value,
  max,
  tone = "info",
  detail,
}: {
  label: string;
  value: number;
  max: number;
  tone?: OpsTone;
  detail?: string;
}) {
  const pct = max ? Math.max(3, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="truncate font-semibold text-slate-700">{label}</span>
        <span className="whitespace-nowrap text-slate-500">{detail ?? value}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${toneAccentClasses[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
      {text}
    </div>
  );
}

export function ActivityIcon() {
  return <Activity className="size-4" />;
}

export function SituationAssessmentPanel({
  title,
  summary,
  items,
}: {
  title: string;
  summary: string;
  items: Array<{
    title: string;
    detail: string;
    tone?: OpsTone;
  }>;
}) {
  return (
    <OpsCard className="border-cyan-200 bg-[radial-gradient(circle_at_top_left,#ecfeff,#fff_32%,#f8fafc)]">
      <SectionHeading
        title={title}
        description="Nhận định này được suy ra từ số liệu thực tế đang tải trên tab hiện tại."
      />
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
        <p className="text-sm font-semibold text-slate-950">{summary}</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className={`rounded-2xl border p-4 ${toneClasses[item.tone ?? "info"]}`}
          >
            <p className="text-sm font-bold text-slate-950">{item.title}</p>
            <p className="mt-2 text-sm leading-5 text-slate-600">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </OpsCard>
  );
}
