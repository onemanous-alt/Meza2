import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type LayerKey = "system" | "plan" | "practice" | "reality" | "ai";

export const layerMeta: Record<LayerKey, { label: string; icon: string; tint: string }> = {
  system: { label: "السيل الجارف", icon: "🌊", tint: "var(--layer-system)" },
  plan: { label: "الخطة", icon: "🎯", tint: "var(--layer-plan)" },
  practice: { label: "الأوراد", icon: "🧿", tint: "var(--layer-practice)" },
  reality: { label: "الواقع", icon: "📅", tint: "var(--layer-reality)" },
  ai: { label: "تحليل AI", icon: "🧠", tint: "var(--layer-ai)" },
};

export function LayerBadge({ layer, text }: { layer: LayerKey; text?: string }) {
  const m = layerMeta[layer];
  return (
    <span
      className="layer-tint inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ ["--tint" as string]: m.tint }}
    >
      <span aria-hidden>{m.icon}</span>
      {text ?? m.label}
    </span>
  );
}

const sourceMap: Record<string, string> = {
  fact: "حقيقة",
  interpretation: "تفسير المستخدم",
  hypothesis: "فرضية",
  ai: "استنتاج AI",
  decision: "قرار",
};

export function SourceBadge({ type }: { type: keyof typeof sourceMap | string }) {
  const tint =
    type === "fact"
      ? "var(--layer-reality)"
      : type === "ai"
        ? "var(--layer-ai)"
        : type === "decision"
          ? "var(--layer-plan)"
          : "var(--muted-foreground)";
  return (
    <span
      className="layer-tint inline-flex rounded border px-2 py-0.5 text-[11px]"
      style={{ ["--tint" as string]: tint }}
    >
      {sourceMap[type] ?? type}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const strong = ["حالي", "معتمد", "قيد الاختبار"].includes(status);
  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-0.5 text-[11px]",
        strong
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

export function ConfidenceBadge({ level }: { level: "منخفض" | "متوسط" | "مرتفع" }) {
  const bars = level === "مرتفع" ? 3 : level === "متوسط" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="flex items-end gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "w-1 rounded-sm",
              i <= bars ? "bg-primary" : "bg-border",
              i === 1 ? "h-1.5" : i === 2 ? "h-2.5" : "h-3.5",
            )}
          />
        ))}
      </span>
      ثقة {level}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  layer,
  actions,
}: {
  title: string;
  description?: string | undefined;
  layer?: LayerKey | undefined;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
      <div className="space-y-2">
        {layer && <LayerBadge layer={layer} />}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions}
    </header>
  );
}

export function Section({
  title,
  hint,
  children,
  actions,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Panel({
  children,
  className,
  tint,
}: {
  children: ReactNode;
  className?: string | undefined;
  tint?: LayerKey | undefined;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card/60 p-5",
        tint && "border-r-2",
        className,
      )}
      style={tint ? { borderRightColor: layerMeta[tint].tint } : undefined}
    >
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function AiInsight({
  conclusion,
  evidence,
  date,
  confidence,
  alternatives,
  status,
  sources,
}: {
  conclusion: string;
  evidence: string[];
  date: string;
  confidence: "منخفض" | "متوسط" | "مرتفع";
  alternatives?: string[];
  status?: string;
  sources?: string[];
}) {
  return (
    <article
      className="rounded-lg border border-border bg-card/50 p-5"
      style={{ borderRightWidth: 2, borderRightColor: layerMeta.ai.tint }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <LayerBadge layer="ai" text="استنتاج AI" />
        {status && <StatusBadge status={status} />}
        <span className="text-[11px] text-muted-foreground">{date}</span>
        <span className="ms-auto">
          <ConfidenceBadge level={confidence} />
        </span>
      </div>
      <p className="text-sm leading-relaxed">{conclusion}</p>
      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div>
          <dt className="mb-1 text-muted-foreground">الأدلة</dt>
          <dd className="space-y-1">
            {evidence.map((e) => (
              <div key={e} className="text-foreground/90">
                • {e}
              </div>
            ))}
          </dd>
        </div>
        {alternatives?.length ? (
          <div>
            <dt className="mb-1 text-muted-foreground">تفسيرات بديلة</dt>
            <dd className="space-y-1">
              {alternatives.map((a) => (
                <div key={a} className="text-foreground/90">
                  • {a}
                </div>
              ))}
            </dd>
          </div>
        ) : null}
        {sources?.length ? (
          <div className="sm:col-span-2">
            <dt className="mb-1 text-muted-foreground">المصادر المرتبطة</dt>
            <dd className="flex flex-wrap gap-2">
              {sources.map((s) => (
                <span key={s} className="rounded border border-border px-2 py-0.5 text-[11px]">
                  {s}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

export function LevelBadge({ level }: { level: string }) {
  const tint =
    level === "تنفيذ كامل" || level === "أعلى من المخطط"
      ? "var(--layer-reality)"
      : level === "تنفيذ جزئي"
        ? "var(--layer-plan)"
        : "var(--muted-foreground)";
  return (
    <span
      className="layer-tint inline-flex rounded border px-2 py-0.5 text-[11px]"
      style={{ ["--tint" as string]: tint }}
    >
      {level}
    </span>
  );
}

export function NoteBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
      {children}
    </div>
  );
}
