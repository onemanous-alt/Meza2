import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { NoteBanner, PageHeader, Panel, StatusBadge } from "@/components/layer-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getOrCreateSystem,
  kindLabel,
  listAdoptions,
  listVersions,
  rollbackToVersion,
  snapshotComponents,
} from "@/lib/system";


export const Route = createFileRoute("/_authenticated/versions")({
  head: () => ({
    meta: [
      { title: "الإصدارات — السيل الجارف" },
      { name: "description", content: "سجل إصدارات النظام واعتمادها والعودة إليها كأحداث تاريخية." },
      { property: "og:title", content: "الإصدارات — السيل الجارف" },
      { property: "og:description", content: "سجل إصدارات النظام واعتمادها والعودة إليها كأحداث تاريخية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const systemQuery = useQuery({ queryKey: ["system"], queryFn: getOrCreateSystem });
  const systemId = systemQuery.data?.id;

  const versionsQuery = useQuery({
    queryKey: ["system-versions", systemId],
    queryFn: () => listVersions(systemId!),
    enabled: !!systemId,
  });
  const adoptionsQuery = useQuery({
    queryKey: ["system-adoptions", systemId],
    queryFn: () => listAdoptions(systemId!),
    enabled: !!systemId,
  });

  const versions = versionsQuery.data ?? [];
  const adoptions = adoptionsQuery.data ?? [];
  const currentVersionId = adoptions[0]?.system_version_id ?? null;
  const versionNumbers = new Map(versions.map((v) => [v.id, v.version_number]));

  const queryClient = useQueryClient();
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const rollback = useMutation({
    mutationFn: (versionId: string) =>
      rollbackToVersion({ systemId: systemId!, versionId, reason: reason.trim() || "رجوع بقرار المستخدم" }),
    onSuccess: async () => {
      setOpenFor(null);
      setReason("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["system-adoptions", systemId] }),
        queryClient.invalidateQueries({ queryKey: ["system-current", systemId] }),
        queryClient.invalidateQueries({ queryKey: ["system-versions", systemId] }),
      ]);
      toast.success("سُجِّل الرجوع كحدث اعتماد جديد دون حذف أي نسخة.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "تعذّر تسجيل الرجوع"),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإصدارات"
        description="كل نسخة معتمدة محفوظة كما هي بتاريخها ومكوّناتها، ولا تُعدَّل ولا تُحذف."
        layer="system"
      />

      {versions.length === 0 && (
        <Panel tint="system">
          <NoteBanner>لا توجد إصدارات بعد. اكتب مكوّنات نظامك في صفحة «السيل الجارف» ثم اعتمدها.</NoteBanner>
        </Panel>
      )}

      <div className="space-y-4">
        {versions.map((v) => {
          const components = snapshotComponents(v);
          const isCurrent = v.id === currentVersionId;
          return (
            <Panel key={v.id} tint="system">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={`نسخة ${v.version_number}`} />
                {isCurrent && <StatusBadge status="معتمد" />}
                {v.name && <span className="text-sm font-medium">{v.name}</span>}
                <span className="ms-auto text-[11px] text-muted-foreground">
                  {formatDate(v.occurred_at)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.change_summary}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {components.map((c) => (
                  <li key={c.key} className="flex items-center gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{c.title}</span>
                    <span className="text-[11px] text-muted-foreground">({kindLabel(c.kind)})</span>
                  </li>
                ))}
              </ul>

              {!isCurrent && (
                <div className="mt-3 border-t border-border/60 pt-3">
                  {openFor === v.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="سبب الرجوع (اختياري)"
                        className="h-9 w-64"
                      />
                      <Button
                        size="sm"
                        onClick={() => rollback.mutate(v.id)}
                        disabled={rollback.isPending}
                      >
                        تأكيد الرجوع
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setOpenFor(null)}>
                        إلغاء
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOpenFor(v.id);
                        setReason("");
                      }}
                    >
                      العودة إلى هذه النسخة
                    </Button>
                  )}
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    الرجوع يُسجَّل كحدث اعتماد جديد بتاريخ جديد، ولا يمسح النسخ اللاحقة.
                  </p>
                </div>
              )}
            </Panel>
          );
        })}
      </div>


      {adoptions.length > 0 && (
        <Panel tint="system">
          <h2 className="mb-3 text-sm font-semibold">أحداث الاعتماد</h2>
          <p className="mb-3 text-[11px] text-muted-foreground">
            السجل مرتّب من الأحدث إلى الأقدم، ولا يُحذف منه شيء عند الرجوع إلى نسخة سابقة.
          </p>
          <ul className="space-y-2 text-sm">
            {adoptions.map((a, i) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2">
                <StatusBadge status={adoptionLabel(a.adoption_type)} />
                <span className="font-medium">نسخة {versionNumbers.get(a.system_version_id) ?? "؟"}</span>
                {i === 0 && <StatusBadge status="سارية الآن" />}
                <span className="text-muted-foreground">{formatDate(a.occurred_at)}</span>
                {a.reason && <span className="text-muted-foreground">— {a.reason}</span>}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function adoptionLabel(type: string) {
  if (type === "adopt") return "اعتماد";
  if (type === "rollback") return "رجوع";
  if (type === "re_adopt") return "إعادة اعتماد";
  return type;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
}
