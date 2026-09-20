import { supabase } from "@/integrations/supabase/client";

/** نسب أي مشروع بلا مالك إلى المستخدم الحالي (أول تسجيل دخول). */
export async function claimUnownedProjects() {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return 0;
  const { data, error } = await supabase
    .from("projects")
    .update({ owner_id: uid })
    .eq("owner_id", "00000000-0000-0000-0000-000000000001")
    .select("id");
  if (error) return 0;
  return data?.length ?? 0;
}

/* ============ الوصف ============ */

export async function updateDescription(
  projectId: string,
  patch: Record<string, unknown>,
  reason: string,
) {
  const { data: current } = await supabase
    .from("project_description")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (current) {
    await supabase.from("project_description_history").insert({
      project_id: projectId,
      version: (current as { version: number }).version,
      snapshot: current as never,
      change_reason: reason,
    });
  }

  const { error } = await supabase
    .from("project_description")
    .update({ ...patch, version: ((current as { version?: number })?.version ?? 1) + 1 } as never)
    .eq("project_id", projectId);
  if (error) throw error;
}

export async function listDescriptionHistory(projectId: string) {
  const { data, error } = await supabase
    .from("project_description_history")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateSummary(projectId: string, patch: Record<string, unknown>) {
  const { error } = await supabase
    .from("project_execution_summary")
    .update(patch as never)
    .eq("project_id", projectId);
  if (error) throw error;
}

/* ============ المراحل ============ */

export async function listPhases(projectId: string) {
  const { data, error } = await supabase
    .from("phases")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertPhase(input: {
  id?: string;
  projectId: string;
  key: string;
  title: string;
  description?: string | null;
  status?: string;
  sortOrder?: number;
}) {
  const row = {
    project_id: input.projectId,
    key: input.key,
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? "pending",
    sort_order: input.sortOrder ?? 0,
  };
  const { error } = input.id
    ? await supabase.from("phases").update(row).eq("id", input.id)
    : await supabase.from("phases").insert(row);
  if (error) throw error;
}

/* ============ الدستور ============ */

export async function listConstitution(projectId: string) {
  const [sectionsRes, rulesRes] = await Promise.all([
    supabase
      .from("constitution_sections")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("constitution_rules")
      .select("*")
      .eq("project_id", projectId)
      .order("code", { ascending: true }),
  ]);
  if (sectionsRes.error) throw sectionsRes.error;
  if (rulesRes.error) throw rulesRes.error;
  return { sections: sectionsRes.data ?? [], rules: rulesRes.data ?? [] };
}

export async function listRuleHistory(projectId: string) {
  const { data, error } = await supabase
    .from("constitution_rule_history")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRule(input: {
  projectId: string;
  sectionId: string | null;
  code: string;
  ruleText: string;
  rationale?: string;
  severity: "red_line" | "caution" | "recommendation" | "execution_rule" | "verification_rule";
}) {
  const { data, error } = await supabase
    .from("constitution_rules")
    .insert({
      project_id: input.projectId,
      section_id: input.sectionId,
      code: input.code,
      rule_text: input.ruleText,
      rationale: input.rationale ?? null,
      severity: input.severity,
    })
    .select()
    .single();
  if (error) throw error;

  await supabase.from("constitution_rule_history").insert({
    project_id: input.projectId,
    rule_id: data.id,
    new_rule_text: input.ruleText,
    new_status: "active",
    change_reason: "إضافة قاعدة جديدة",
  });
  return data;
}

export async function updateRule(input: {
  projectId: string;
  ruleId: string;
  oldText: string;
  oldStatus: "active" | "disabled" | "archived";
  newText?: string;
  newStatus?: "active" | "disabled" | "archived";
  reason: string;
  version: number;
}) {
  const patch: { rule_text?: string; status?: "active" | "disabled" | "archived"; version: number } =
    { version: input.version + 1 };
  if (input.newText) patch.rule_text = input.newText;
  if (input.newStatus) patch.status = input.newStatus;

  const { error } = await supabase.from("constitution_rules").update(patch).eq("id", input.ruleId);
  if (error) throw error;

  await supabase.from("constitution_rule_history").insert({
    project_id: input.projectId,
    rule_id: input.ruleId,
    old_rule_text: input.oldText,
    new_rule_text: input.newText ?? input.oldText,
    old_status: input.oldStatus,
    new_status: input.newStatus ?? input.oldStatus,
    change_reason: input.reason,
  });
}

/* ============ المهام ============ */

export async function createTask(input: {
  projectId: string;
  code: string;
  title: string;
  description?: string;
  goal?: string;
  reason?: string;
  scope?: string;
  successCriteria?: string;
  testingMethod?: string;
  priority?: number;
  nextAction?: string;
  phaseId?: string | null;
}) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: input.projectId,
      code: input.code,
      title: input.title,
      description: input.description ?? null,
      goal: input.goal ?? null,
      reason: input.reason ?? null,
      scope: input.scope ?? null,
      success_criteria: input.successCriteria ?? null,
      testing_method: input.testingMethod ?? null,
      priority: input.priority ?? 2,
      next_action: input.nextAction ?? null,
      phase_id: input.phaseId ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  await supabase.from("execution_logs").insert({
    project_id: input.projectId,
    task_id: data.id,
    event_type: "task_created",
    description: `${input.code}: ${input.title}`,
  });
  return data;
}

export async function updateTaskField(input: {
  projectId: string;
  taskId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  reason?: string;
}) {
  const { error } = await supabase
    .from("tasks")
    .update({ [input.field]: input.newValue } as never)
    .eq("id", input.taskId);
  if (error) throw error;

  await supabase.from("task_changes").insert({
    project_id: input.projectId,
    task_id: input.taskId,
    field_name: input.field,
    old_value: input.oldValue,
    new_value: input.newValue,
    change_reason: input.reason ?? null,
  });
}

export async function getTaskDetails(taskId: string) {
  const [artifactsRes, changesRes, cyclesRes, depsRes] = await Promise.all([
    supabase.from("task_artifacts").select("*, artifacts(*)").eq("task_id", taskId),
    supabase
      .from("task_changes")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false }),
    supabase
      .from("task_cycles")
      .select("*")
      .eq("task_id", taskId)
      .order("cycle_number", { ascending: false }),
    supabase
      .from("task_dependencies")
      .select("depends_on_task_id, tasks!task_dependencies_depends_on_task_id_fkey(code, title, status)")
      .eq("task_id", taskId),
  ]);
  return {
    artifacts: artifactsRes.data ?? [],
    changes: changesRes.data ?? [],
    cycles: cyclesRes.data ?? [],
    dependencies: depsRes.data ?? [],
  };
}

/* ============ سجل التنفيذ ============ */

export async function listProjectLogs(projectId: string, limit = 200) {
  const { data, error } = await supabase
    .from("execution_logs")
    .select("*, tasks(code, title)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listProjectCheckpoints(projectId: string, limit = 100) {
  const { data, error } = await supabase
    .from("checkpoints")
    .select("*, tasks(code, title)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listResumePackages(projectId: string) {
  const { data, error } = await supabase
    .from("resume_packages")
    .select("*, tasks(code, title, status)")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/* ============ القرارات والتعارضات ============ */

export async function listDecisions(projectId: string) {
  const { data, error } = await supabase
    .from("project_decisions")
    .select("*, tasks(code, title)")
    .eq("project_id", projectId)
    .order("decided_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDecision(input: {
  projectId: string;
  title?: string;
  decision: string;
  reason: string;
  alternatives?: string;
  impact?: string;
  taskId?: string | null;
}) {
  const { error } = await supabase.from("project_decisions").insert({
    project_id: input.projectId,
    title: input.title ?? null,
    decision: input.decision,
    reason: input.reason,
    alternatives: input.alternatives ?? null,
    impact: input.impact ?? null,
    task_id: input.taskId ?? null,
  });
  if (error) throw error;
}

export async function setDecisionStatus(
  decisionId: string,
  status: "active" | "superseded" | "reverted",
) {
  const { error } = await supabase
    .from("project_decisions")
    .update({ status })
    .eq("id", decisionId);
  if (error) throw error;
}

export async function listConflicts(projectId: string) {
  const { data, error } = await supabase
    .from("state_conflicts")
    .select("*, tasks(code, title)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createConflict(input: {
  projectId: string;
  taskId?: string | null;
  description: string;
  sourceA?: string;
  sourceB?: string;
  inspectedScope?: string;
}) {
  const { error } = await supabase.from("state_conflicts").insert({
    project_id: input.projectId,
    task_id: input.taskId ?? null,
    description: input.description,
    source_a: input.sourceA ?? null,
    source_b: input.sourceB ?? null,
    inspected_scope: input.inspectedScope ?? null,
  });
  if (error) throw error;
}

export async function resolveConflict(input: {
  conflictId: string;
  finding: string;
  resolution: string;
  status: "open" | "investigating" | "resolved" | "dismissed";
}) {
  const { error } = await supabase
    .from("state_conflicts")
    .update({
      finding: input.finding,
      resolution: input.resolution,
      status: input.status,
    })
    .eq("id", input.conflictId);
  if (error) throw error;
}
