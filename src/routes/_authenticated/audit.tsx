import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { NoteBanner, PageHeader, Panel, StatusBadge } from "@/components/layer-ui";
import { auditSummary, entityLabel, eventLabel, listAuditLogs } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({
    meta: [
      { title: "سجل التدقيق — السيل الجارف" },
      { name: "description", content: "أثر كامل لكل عملية على النظام: الإنشاء والتعديل والاعتماد والرجوع." },
      { property: "og:title", content: "سجل التدقيق — السيل الجارف" },
      {
        property: "og:description",
        content: "أثر كامل لكل عملية على النظام: الإنشاء والتعديل والاعتماد والرجوع.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const logsQuery = useQuery({ queryKey: ["audit-logs"], queryFn: () => listAuditLogs(200) });
  const rows = logsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجل التدقيق"
        description="كل عملية على نظامك مسجّلة بزمن حدوثها وزمن تسجيلها ومن قام بها، ولا تُعدَّل ولا تُحذف."
        layer="reality"
      />

      {logsQuery.isLoading && (
        <Panel tint="reality">
          <NoteBanner>جارٍ تحميل السجل…</NoteBanner>
        </Panel>
      )}

      {logsQuery.isError && (
        <Panel tint="reality">
          <NoteBanner>تعذّر تحميل السجل. أعد تحميل الصفحة.</NoteBanner>
        </Panel>
      )}

      {!logsQuery.isLoading && rows.length === 0 && (
        <Panel tint="reality">
          <NoteBanner>لا توجد عمليات مسجّلة بعد. أي إضافة أو اعتماد أو رجوع سيظهر هنا تلقائيًا.</NoteBanner>
        </Panel>
      )}

      {rows.length > 0 && (
        <Panel tint="reality">
          <ul className="divide-y divide-border/60">
            {rows.map((row) => {
              const summary = auditSummary(row);
              return (
                <li key={row.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={eventLabel(row)} />
                    <span className="text-[11px] text-muted-foreground">{entityLabel(row.entity_table)}</span>
                    <span className="ms-auto text-[11px] text-muted-foreground">
                      {formatDate(row.occurred_at)}
                    </span>
                  </div>
                  {summary && <p className="mt-1 text-sm leading-relaxed">{summary}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    سُجِّل في {formatDate(row.recorded_at)}
                  </p>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
}
