import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { NoteBanner, PageHeader, Panel, Section, StatusBadge } from "@/components/layer-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DIFF_LABEL,
  diffCounts,
  diffVersions,
  listComponentLineage,
  versionNumberMap,
  type ComponentDiff,
  type DiffType,
} from "@/lib/system-diff";
import { getOrCreateSystem, kindLabel, listVersions } from "@/lib/system";

export const Route = createFileRoute("/_authenticated/system-changes")({
  head: () => ({
    meta: [
      { title: "تغييرات السيل الجارف — السيل الجارف" },
      { name: "description", content: "ما تغيّر بين إصدار وآخر وسببه ومن قرّره." },
      { property: "og:title", content: "تغييرات السيل الجارف — السيل الجارف" },
      { property: "og:description", content: "ما تغيّر بين إصدار وآخر وسببه ومن قرّره." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const TYPE_STYLE: Record<DiffType, string> = {
  added: "border-emerald-500/40 bg-emerald-500/5",
  modified: "border-amber-500/40 bg-amber-500/5",
  removed: "border-rose-500/40 bg-rose-500/5",
  unchanged: "border-border/60",
};

function Page() {
  const systemQuery = useQuery({ queryKey: ["system"], queryFn: getOrCreateSystem });
  const systemId = systemQuery.data?.id;

  const versionsQuery = useQuery({
    queryKey: ["system-versions", systemId],
    queryFn: () => listVersions(systemId!),
    enabled: !!systemId,
  });
  const lineageQuery = useQuery({
    queryKey: ["component-lineage", systemId],
    queryFn: () => listComponentLineage(systemId!),
    enabled: !!systemId,
  });
  const versionMapQuery = useQuery({
    queryKey: ["version-numbers", systemId],
    queryFn: () => versionNumberMap(systemId!),
    enabled: !!systemId,
  });

  const versions = versionsQuery.data ?? [];
  const [targetId, setTargetId] = useState<string | null>(null);
  const [baseId, setBaseId] = useState<string | null>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);

  const target = versions.find((v) => v.id === targetId) ?? versions[0] ?? null;
  const defaultBase = versions.find((v) => target && v.version_number < target.version_number) ?? null;
  const base = versions.find((v) => v.id === baseId) ?? defaultBase;

  const diffs = useMemo(() => diffVersions(base, target), [base, target]);
  const counts = diffCounts(diffs);
  const visible = showUnchanged ? diffs : diffs.filter((d) => d.type !== "unchanged");

  return (
    <div className="space-y-6">
      <PageHeader
        title="تغييرات السيل الجارف"
        description="ما تغيّر بين إصدار وآخر ومن أي مكوّن، مع سلالة كل مكوّن عبر الإصدارات."
        layer="system"
      />

      {versions.length === 0 ? (
        <Panel tint="system">
          <NoteBanner>لا توجد إصدارات بعد. اعتمد نسخة من صفحة «السيل الجارف» لتظهر المقارنة هنا.</NoteBanner>
        </Panel>
      ) : (
        <>
          <Panel tint="system">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">النسخة الأساس</span>
                <Select
                  value={base?.id ?? "none"}
                  onValueChange={(v) => setBaseId(v === "none" ? null : v)}
                >
                  <SelectTrigger className="h-9 w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">لا شيء (بداية)</SelectItem>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        نسخة {v.version_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">النسخة المقارَنة</span>
                <Select value={target?.id ?? ""} onValueChange={(v) => setTargetId(v)}>
                  <SelectTrigger className="h-9 w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        نسخة {v.version_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="ms-auto flex flex-wrap items-center gap-2 text-[11px]">
                <StatusBadge status={`جديد ${counts.added}`} />
                <StatusBadge status={`مُعدّل ${counts.modified}`} />
                <StatusBadge status={`محذوف ${counts.removed}`} />
                <button
                  type="button"
                  onClick={() => setShowUnchanged((s) => !s)}
                  className="rounded-md border border-border/60 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {showUnchanged ? "إخفاء ما لم يتغيّر" : `إظهار ما لم يتغيّر (${counts.unchanged})`}
                </button>
              </div>
            </div>
            {target && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {base
                  ? `الفرق بين نسخة ${base.version_number} ونسخة ${target.version_number}.`
                  : `مكوّنات نسخة ${target.version_number} كما اعتُمدت أول مرة.`}{" "}
                {target.change_summary}
              </p>
            )}
          </Panel>

          <Section title="نقاط التغيير">
            {visible.length === 0 ? (
              <NoteBanner>لا فرق بين النسختين المختارتين.</NoteBanner>
            ) : (
              <div className="space-y-3">
                {visible.map((d) => (
                  <DiffCard key={d.key} diff={d} />
                ))}
              </div>
            )}
          </Section>
        </>
      )}

      <Section title="سلالة المكوّنات">
        {(lineageQuery.data ?? []).length === 0 ? (
          <NoteBanner>لا توجد مكوّنات معتمدة بعد، فلا سلالة تُعرض.</NoteBanner>
        ) : (
          <div className="space-y-3">
            {(lineageQuery.data ?? []).map((c) => (
              <Panel key={c.componentId} tint="system">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{c.title}</span>
                  <span className="text-[11px] text-muted-foreground">({kindLabel(c.kind)})</span>
                  <StatusBadge status={`${c.versions.length} إصدار`} />
                  <span className="ms-auto font-mono text-[11px] text-muted-foreground">{c.key}</span>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {c.versions.map((v) => {
                    const num = v.system_version_id
                      ? versionMapQuery.data?.[v.system_version_id]
                      : undefined;
                    return (
                      <li key={v.id} className="rounded-md border border-border/60 p-2">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <StatusBadge status={`إصدار ${v.version_number}`} />
                          {num !== undefined && <span>ضمن نسخة النظام {num}</span>}
                          <span>{lifecycleLabel(v.lifecycle_state)}</span>
                          <span className="ms-auto">{formatDate(v.occurred_at)}</span>
                        </div>
                        <p className="mt-1 text-sm">{v.title}</p>
                        {v.change_reason && (
                          <p className="mt-1 text-[11px] text-muted-foreground">سبب التغيير: {v.change_reason}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function DiffCard({ diff }: { diff: ComponentDiff }) {
  const beforeBody = (diff.previous?.definition?.body ?? "").trim();
  const afterBody = (diff.next?.definition?.body ?? "").trim();
  return (
    <div className={`rounded-lg border p-3 ${TYPE_STYLE[diff.type]}`}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={DIFF_LABEL[diff.type]} />
        <span className="text-sm font-medium">{diff.title}</span>
        <span className="font-mono text-[11px] text-muted-foreground">{diff.key}</span>
        {diff.fields.length > 0 && (
          <span className="text-[11px] text-muted-foreground">تغيّر: {diff.fields.join("، ")}</span>
        )}
      </div>
      {diff.type === "modified" && (
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <BodyBlock label="قبل" body={beforeBody} />
          <BodyBlock label="بعد" body={afterBody} />
        </div>
      )}
      {diff.type === "added" && afterBody && <BodyBlock label="النص" body={afterBody} />}
      {diff.type === "removed" && beforeBody && <BodyBlock label="النص المحذوف" body={beforeBody} />}
    </div>
  );
}

function BodyBlock({ label, body }: { label: string; body: string }) {
  return (
    <div className="mt-2 rounded-md border border-border/60 bg-background/40 p-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{body || "—"}</p>
    </div>
  );
}

function lifecycleLabel(state: string) {
  if (state === "active") return "نشِط";
  if (state === "removed") return "محذوف";
  if (state === "modified") return "مُعدّل";
  return state;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
}
