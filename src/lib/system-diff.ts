import { supabase } from "@/integrations/supabase/client";

import { snapshotComponents, type SnapshotComponent, type SystemVersionRow } from "@/lib/system";

export type DiffType = "added" | "modified" | "removed" | "unchanged";

export type ComponentDiff = {
  key: string;
  type: DiffType;
  title: string;
  previous: SnapshotComponent | null;
  next: SnapshotComponent | null;
  fields: string[];
};

export const DIFF_LABEL: Record<DiffType, string> = {
  added: "مكوّن جديد",
  modified: "تعديل",
  removed: "حُذف",
  unchanged: "كما هو",
};

function bodyOf(c: SnapshotComponent | null | undefined) {
  return (c?.definition?.body ?? "").trim();
}

/** مقارنة نسختين معتمدتين اعتمادًا على لقطة كل نسخة (لا يُعاد كتابة أي سجل). */
export function diffVersions(
  base: SystemVersionRow | null | undefined,
  target: SystemVersionRow | null | undefined,
): ComponentDiff[] {
  const before = new Map(snapshotComponents(base).map((c) => [c.key, c]));
  const after = new Map(snapshotComponents(target).map((c) => [c.key, c]));
  const keys = [...new Set([...after.keys(), ...before.keys()])];

  const result: ComponentDiff[] = keys.map((key) => {
    const previous = before.get(key) ?? null;
    const next = after.get(key) ?? null;

    if (!previous && next) {
      return { key, type: "added", title: next.title, previous: null, next, fields: [] };
    }
    if (previous && !next) {
      return { key, type: "removed", title: previous.title, previous, next: null, fields: [] };
    }

    const fields: string[] = [];
    if (previous!.title !== next!.title) fields.push("العنوان");
    if (previous!.kind !== next!.kind) fields.push("النوع");
    if (bodyOf(previous) !== bodyOf(next)) fields.push("النص");
    if (previous!.lifecycle_state !== next!.lifecycle_state) fields.push("الحالة");

    return {
      key,
      type: fields.length > 0 ? "modified" : "unchanged",
      title: next!.title,
      previous,
      next,
      fields,
    };
  });

  const order: DiffType[] = ["added", "modified", "removed", "unchanged"];
  return result.sort((a, b) => {
    const byType = order.indexOf(a.type) - order.indexOf(b.type);
    if (byType !== 0) return byType;
    return (a.next?.sort_order ?? a.previous?.sort_order ?? 0) - (b.next?.sort_order ?? b.previous?.sort_order ?? 0);
  });
}

export function diffCounts(diffs: ComponentDiff[]) {
  return {
    added: diffs.filter((d) => d.type === "added").length,
    modified: diffs.filter((d) => d.type === "modified").length,
    removed: diffs.filter((d) => d.type === "removed").length,
    unchanged: diffs.filter((d) => d.type === "unchanged").length,
  };
}

export type ComponentLineageVersion = {
  id: string;
  version_number: number;
  lifecycle_state: string;
  title: string;
  kind: string;
  change_reason: string | null;
  occurred_at: string;
  recorded_at: string;
  previous_version_id: string | null;
  system_version_id: string | null;
  definition: { body?: string } | null;
};

export type ComponentLineage = {
  componentId: string;
  key: string;
  title: string;
  kind: string;
  status: string;
  versions: ComponentLineageVersion[];
};

/** سلالة كل مكوّن: كل إصداراته بترتيبها التاريخي دون حذف أي حلقة. */
export async function listComponentLineage(systemId: string): Promise<ComponentLineage[]> {
  const [{ data: components, error: cErr }, { data: versions, error: vErr }] = await Promise.all([
    supabase
      .from("system_components")
      .select("id, key, title, kind, status")
      .eq("system_id", systemId)
      .order("created_at", { ascending: true }),
    supabase
      .from("system_component_versions")
      .select(
        "id, component_id, version_number, lifecycle_state, title, kind, change_reason, occurred_at, recorded_at, previous_version_id, system_version_id, definition",
      )
      .eq("system_id", systemId)
      .order("version_number", { ascending: false }),
  ]);
  if (cErr) throw cErr;
  if (vErr) throw vErr;

  const byComponent = new Map<string, ComponentLineageVersion[]>();
  for (const row of (versions ?? []) as unknown as (ComponentLineageVersion & { component_id: string })[]) {
    const list = byComponent.get(row.component_id) ?? [];
    list.push(row);
    byComponent.set(row.component_id, list);
  }

  return ((components ?? []) as unknown as { id: string; key: string; title: string; kind: string; status: string }[]).map(
    (c) => ({
      componentId: c.id,
      key: c.key,
      title: c.title,
      kind: c.kind,
      status: c.status,
      versions: byComponent.get(c.id) ?? [],
    }),
  );
}

/** أرقام إصدارات النظام مفهرسة لعرض «ظهر في نسخة رقم كذا». */
export async function versionNumberMap(systemId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("system_versions")
    .select("id, version_number")
    .eq("system_id", systemId);
  if (error) throw error;
  const map: Record<string, number> = {};
  for (const row of (data ?? []) as unknown as { id: string; version_number: number }[]) {
    map[row.id] = row.version_number;
  }
  return map;
}
