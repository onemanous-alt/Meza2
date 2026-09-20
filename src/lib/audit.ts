import { supabase } from "@/integrations/supabase/client";

export type AuditRow = {
  id: string;
  entity_table: string;
  entity_id: string;
  action: string;
  details: Record<string, unknown> | null;
  occurred_at: string;
  recorded_at: string;
  actor: string;
  source: string;
};

/** سجل التدقيق: أحداث فقط، لا يُعدَّل ولا يُحذف. */
export async function listAuditLogs(limit = 200): Promise<AuditRow[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, entity_table, entity_id, action, details, occurred_at, recorded_at, actor, source")
    .order("occurred_at", { ascending: false })
    .order("recorded_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as unknown as AuditRow[];
  return enrichWithVersionNumbers(rows);
}

/** أرقام النسخ المشار إليها في أحداث الاعتماد، حتى يفهم المستخدم أي نسخة تخصّ الحدث. */
async function enrichWithVersionNumbers(rows: AuditRow[]): Promise<AuditRow[]> {
  const ids = new Set<string>();
  for (const row of rows) {
    const d = (row.details ?? {}) as Record<string, unknown>;
    if (typeof d["version_number"] === "number") continue;
    const vid = d["system_version_id"];
    if (typeof vid === "string" && vid) ids.add(vid);
  }
  if (ids.size === 0) return rows;

  const { data, error } = await supabase
    .from("system_versions")
    .select("id, version_number, name")
    .in("id", [...ids]);
  if (error || !data) return rows;

  const byId = new Map(data.map((v) => [v.id as string, v]));
  return rows.map((row) => {
    const d = (row.details ?? {}) as Record<string, unknown>;
    const vid = d["system_version_id"];
    if (typeof vid !== "string") return row;
    const v = byId.get(vid);
    if (!v) return row;
    return {
      ...row,
      details: { ...d, version_number: v.version_number, name: d["name"] ?? v.name },
    };
  });
}

const ACTION_LABELS: Record<string, string> = {
  adopt: "اعتماد نسخة",
  rollback: "رجوع إلى نسخة سابقة",
  re_adopt: "إعادة اعتماد نسخة",
  publish_version: "نشر نسخة جديدة",
  draft_create: "إضافة مكوّن إلى المسودة",
  draft_update: "تعديل مكوّن في المسودة",
  draft_delete: "حذف مكوّن من المسودة",
  version_adoptions_insert: "حدث اعتماد",
  system_versions_insert: "نشر نسخة جديدة",
  system_components_insert: "إنشاء مكوّن في النظام",
  system_components_update: "تعديل مكوّن في النظام",
  system_component_versions_insert: "حفظ نسخة من مكوّن",
  operating_systems_insert: "إنشاء النظام",
  operating_systems_update: "تعديل بيانات النظام",
};

const ADOPTION_TYPE_LABELS: Record<string, string> = {
  adopt: "اعتماد نسخة",
  rollback: "رجوع إلى نسخة سابقة",
  re_adopt: "إعادة اعتماد نسخة",
};

export function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action;
}

/** عنوان الحدث كما يفهمه المستخدم: نوع الاعتماد إن وُجد، وإلا اسم العملية. */
export function eventLabel(row: AuditRow): string {
  const d = (row.details ?? {}) as Record<string, unknown>;
  const type = d["adoption_type"];
  if (typeof type === "string" && ADOPTION_TYPE_LABELS[type]) return ADOPTION_TYPE_LABELS[type]!;
  return actionLabel(row.action);
}

const ENTITY_LABELS: Record<string, string> = {
  version_adoptions: "اعتماد",
  system_versions: "نسخة",
  system_components: "مكوّن",
  system_component_versions: "نسخة مكوّن",
  system_component_drafts: "مسودة",
  operating_systems: "النظام",
};

export function entityLabel(table: string) {
  return ENTITY_LABELS[table] ?? table;
}

/** وصف مختصر للحدث مأخوذ من تفاصيله المسجّلة. */
export function auditSummary(row: AuditRow): string | null {
  const d = (row.details ?? {}) as Record<string, unknown>;
  const pick = (k: string) => {
    const v = d[k];
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };
  const number = typeof d["version_number"] === "number" ? `نسخة ${d["version_number"]}` : null;
  return (
    [number, pick("title"), pick("name"), pick("reason"), pick("change_summary")]
      .filter(Boolean)
      .join(" — ") || null
  );
}
