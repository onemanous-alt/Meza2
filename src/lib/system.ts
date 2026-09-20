import { supabase } from "@/integrations/supabase/client";

export const COMPONENT_KINDS: { value: string; label: string }[] = [
  { value: "principle", label: "مبدأ" },
  { value: "rule", label: "قاعدة" },
  { value: "practice", label: "ورد / ممارسة" },
  { value: "process", label: "إجراء" },
  { value: "structure", label: "بنية" },
  { value: "other", label: "أخرى" },
];

export function kindLabel(kind: string) {
  return COMPONENT_KINDS.find((k) => k.value === kind)?.label ?? kind;
}

export type DraftComponent = {
  id: string;
  system_id: string;
  key: string;
  title: string;
  kind: string;
  body: string;
  sort_order: number;
  status: string;
  updated_at: string;
};

export type SystemRow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
};

/** النظام التشغيلي الحالي للمستخدم، ويُنشأ مرة واحدة إن لم يوجد. */
export async function getOrCreateSystem(): Promise<SystemRow> {
  const { data, error } = await supabase
    .from("operating_systems")
    .select("id, name, description, status")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as SystemRow;

  const { data: created, error: insertError } = await supabase
    .from("operating_systems")
    .insert({ name: "السيل الجارف", status: "active" } as never)
    .select("id, name, description, status")
    .single();
  if (insertError) throw insertError;
  return created as SystemRow;
}

export async function listDraft(systemId: string): Promise<DraftComponent[]> {
  const { data, error } = await supabase
    .from("system_component_drafts")
    .select("*")
    .eq("system_id", systemId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DraftComponent[];
}

function slugKey(title: string, fallback: number) {
  const base = title
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, 48);
  return base.length > 0 ? base : `component-${fallback}`;
}

export async function addDraftComponent(systemId: string, existing: DraftComponent[]) {
  const n = existing.length + 1;
  const { data, error } = await supabase
    .from("system_component_drafts")
    .insert({
      system_id: systemId,
      key: `component-${Date.now().toString(36)}`,
      title: `مكوّن ${n}`,
      kind: "principle",
      body: "",
      sort_order: n * 10,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as DraftComponent;
}

export async function updateDraftComponent(
  id: string,
  patch: Partial<Pick<DraftComponent, "title" | "kind" | "body" | "sort_order" | "status" | "key">>,
) {
  const { error } = await supabase
    .from("system_component_drafts")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteDraftComponent(id: string) {
  const { error } = await supabase.from("system_component_drafts").delete().eq("id", id);
  if (error) throw error;
}

/** تحويل العناوين إلى مفاتيح مقروءة قبل الاعتماد (مرة واحدة لكل مكوّن جديد). */
export async function normalizeKeys(items: DraftComponent[]) {
  const used = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    if (!/^component-[a-z0-9]+$/.test(item.key)) {
      used.add(item.key);
      continue;
    }
    let key = slugKey(item.title, i + 1);
    let suffix = 2;
    while (used.has(key)) key = `${slugKey(item.title, i + 1)}-${suffix++}`;
    used.add(key);
    await updateDraftComponent(item.id, { key });
  }
}

export async function publishVersion(input: {
  systemId: string;
  changeSummary: string;
  name?: string | null;
  occurredAt?: string | null;
}) {
  const { data, error } = await supabase.rpc("publish_system_version", {
    _system_id: input.systemId,
    _change_summary: input.changeSummary,
    ...(input.name ? { _name: input.name } : {}),
    _occurred_at: input.occurredAt ?? new Date().toISOString(),
  });
  if (error) throw error;
  return data as string;
}

export type SystemVersionRow = {
  id: string;
  version_number: number;
  name: string | null;
  change_summary: string;
  occurred_at: string;
  recorded_at: string;
  snapshot: { components?: Array<Record<string, unknown>> } | null;
};

export async function listVersions(systemId: string) {
  const { data, error } = await supabase
    .from("system_versions")
    .select("id, version_number, name, change_summary, occurred_at, recorded_at, snapshot")
    .eq("system_id", systemId)
    .order("version_number", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SystemVersionRow[];
}

export type AdoptionRow = {
  id: string;
  system_version_id: string;
  adoption_type: string;
  reason: string | null;
  occurred_at: string;
  sequence_no: number;
  supersedes_adoption_id: string | null;
};

export async function listAdoptions(systemId: string): Promise<AdoptionRow[]> {
  const { data, error } = await supabase
    .from("version_adoptions")
    .select("id, system_version_id, adoption_type, reason, occurred_at, sequence_no, supersedes_adoption_id")
    .eq("system_id", systemId)
    .order("sequence_no", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdoptionRow[];
}

/**
 * الرجوع إلى نسخة سابقة: يُسجَّل كحدث اعتماد جديد بتاريخ جديد،
 * ولا يُحذف أي اعتماد لاحق ولا تُعدَّل أي نسخة محفوظة.
 */
export async function rollbackToVersion(input: {
  systemId: string;
  versionId: string;
  reason: string;
  occurredAt?: string | null;
}) {
  const adoptions = await listAdoptions(input.systemId);
  const current = adoptions[0] ?? null;
  const adoptedBefore = adoptions.some((a) => a.system_version_id === input.versionId);

  const { data, error } = await supabase
    .from("version_adoptions")
    .insert({
      system_id: input.systemId,
      system_version_id: input.versionId,
      adoption_type: adoptedBefore ? "rollback" : "adopt",
      supersedes_adoption_id: current?.id ?? null,
      reason: input.reason,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      recorded_by: "user",
      source: "user",
    } as never)
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}


/** النسخة المعتمدة حاليًا (آخر حدث اعتماد). */
export async function getCurrentVersion(systemId: string) {
  const adoptions = await listAdoptions(systemId);
  const latest = adoptions[0];
  if (!latest) return null;
  const { data, error } = await supabase
    .from("system_versions")
    .select("id, version_number, name, change_summary, occurred_at, recorded_at, snapshot")
    .eq("id", latest.system_version_id)
    .maybeSingle();
  if (error) throw error;
  return data ? ({ version: data as unknown as SystemVersionRow, adoption: latest }) : null;
}

export type SnapshotComponent = {
  key: string;
  title: string;
  kind: string;
  definition: { body?: string } | null;
  lifecycle_state: string;
  sort_order: number;
};

export function snapshotComponents(v: SystemVersionRow | null | undefined): SnapshotComponent[] {
  const list = (v?.snapshot?.components ?? []) as unknown as SnapshotComponent[];
  return Array.isArray(list) ? list : [];
}
