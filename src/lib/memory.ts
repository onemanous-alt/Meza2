import { supabase } from "@/integrations/supabase/client";


export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "reopened"
  | "cancelled"
  | "soft_deleted";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "في الانتظار",
  in_progress: "جارية",
  completed: "مكتملة",
  reopened: "أعيد فتحها",
  cancelled: "ملغاة",
  soft_deleted: "محذوفة",
};

export const SEVERITY_LABEL: Record<string, string> = {
  red_line: "خط أحمر",
  caution: "محذور",
  recommendation: "توصية",
  execution_rule: "قاعدة تنفيذ",
  verification_rule: "قاعدة تحقق",
};

/**
 * المشروع المعتمد الوحيد للتنفيذ.
 * المرجع هو الملخص التشغيلي المعلَّم is_authoritative، وليس ترتيب الإنشاء —
 * حتى لا تقرأ أي جلسة سجل مشروع فارغ وتفترض أن المشروع بلا مهام (قرار: مشروع معتمد واحد).
 */
export async function getCurrentProject() {
  const { data: authoritative, error: authErr } = await supabase
    .from("project_execution_summary")
    .select("project_id, projects!inner(*)")
    .eq("is_authoritative", true)
    .eq("projects.status", "active")
    .limit(1)
    .maybeSingle();
  if (authErr) throw authErr;
  if (authoritative?.projects) return authoritative.projects as any;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}


export async function getOverview() {
  const project = await getCurrentProject();
  if (!project) return { project: null, summary: null, description: null, counts: {} as Record<string, number>, currentTask: null };

  const [summaryRes, descRes, tasksRes] = await Promise.all([
    supabase.from("project_execution_summary").select("*").eq("project_id", project.id).maybeSingle(),
    supabase.from("project_description").select("*").eq("project_id", project.id).maybeSingle(),
    supabase.from("tasks").select("id, code, title, status, priority, next_action").eq("project_id", project.id),
  ]);
  if (summaryRes.error) throw summaryRes.error;
  if (descRes.error) throw descRes.error;
  if (tasksRes.error) throw tasksRes.error;

  const counts: Record<string, number> = {};
  for (const t of tasksRes.data ?? []) counts[t.status] = (counts[t.status] ?? 0) + 1;

  const currentTaskId = summaryRes.data?.current_task_id ?? null;
  const taskRows = tasksRes.data ?? [];
  const currentTask =
    taskRows.find((t: { id: string }) => t.id === currentTaskId) ??
    taskRows.find((t: { status: string }) => t.status === "in_progress") ??
    null;

  return { project, summary: summaryRes.data, description: descRes.data, counts, currentTask };
}

export async function listTasks(projectId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** T12: البحث عن المهمة من كلام المستخدم (عنوان/وصف/هدف/كلمات مفتاحية). */
export function findCandidateTasks<T extends { title: string; description: string | null; goal: string | null; keywords: string[] | null; code: string | null }>(
  tasks: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  const score = (t: T) => {
    const hay = [t.code, t.title, t.description, t.goal, (t.keywords ?? []).join(" ")]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    let s = hay.includes(q) ? 3 : 0;
    for (const w of words) if (hay.includes(w)) s += 1;
    return s;
  };
  return tasks
    .map((t) => ({ t, s: score(t) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.t);
}

/** T11: حزمة السياق الدنيا لمهمة واحدة. */
export async function getMinimalTaskContext(taskId: string) {
  const { data, error } = await supabase.rpc("get_minimal_task_context", { _task_id: taskId });
  if (error) throw error;
  return data as MinimalTaskContext | null;
}

export type MinimalTaskContext = {
  task: Record<string, unknown> & { id: string; code: string | null; title: string; status: TaskStatus };
  task_description: string | null;
  resume_package: Record<string, any> | null;
  last_checkpoint: Record<string, any> | null;
  relevant_decisions: Array<Record<string, any>>;
  relevant_constitution_rules: Array<{ code: string | null; severity: string; rule_text: string; note: string | null }>;
  registered_artifacts: Array<{ kind: string; identifier: string; action: string; purpose: string | null }>;
  dependencies: Array<{ code: string | null; title: string; status: TaskStatus }>;
  open_conflicts: Array<Record<string, any>>;
  recent_logs: Array<{ event_type: string; description: string; outcome: string | null; at: string }>;
};

export async function listExecutionLogs(taskId: string) {
  const { data, error } = await supabase
    .from("execution_logs")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listCheckpoints(taskId: string) {
  const { data, error } = await supabase
    .from("checkpoints")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function logEvent(input: {
  projectId: string;
  taskId?: string | null;
  eventType: string;
  description: string;
  outcome?: string | null;
}) {
  const { error } = await supabase.from("execution_logs").insert({
    project_id: input.projectId,
    task_id: input.taskId ?? null,
    event_type: input.eventType,
    description: input.description,
    outcome: input.outcome ?? null,
  });
  if (error) throw error;
}

/** حفظ نقطة حفظ + تحديث حزمة الاستكمال والمهمة في نفس العملية (قاعدة دورة التنفيذ). */
export async function saveCheckpoint(input: {
  projectId: string;
  taskId: string;
  doneSummary: string;
  lastSuccessfulStep: string;
  remaining?: string;
  nextAction: string;
  changedFiles?: string[];
  changedTables?: string[];
  changedApis?: string[];
  tests?: string;
  issues?: string;
  isFinal?: boolean;
}) {
  const { data: cp, error } = await supabase
    .from("checkpoints")
    .insert({
      project_id: input.projectId,
      task_id: input.taskId,
      done_summary: input.doneSummary,
      last_successful_step: input.lastSuccessfulStep,
      remaining: input.remaining ?? null,
      next_action: input.nextAction,
      changed_files: input.changedFiles ?? [],
      changed_tables: input.changedTables ?? [],
      changed_apis: input.changedApis ?? [],
      tests: input.tests ?? null,
      issues: input.issues ?? null,
      is_final: input.isFinal ?? false,
    })
    .select()
    .single();
  if (error) throw error;

  const { data: existing } = await supabase
    .from("resume_packages")
    .select("id")
    .eq("task_id", input.taskId)
    .eq("is_active", true)
    .maybeSingle();

  const payload = {
    project_id: input.projectId,
    task_id: input.taskId,
    current_state: "in_progress",
    completed: input.doneSummary,
    remaining: input.remaining ?? null,
    last_known_good_state: input.lastSuccessfulStep,
    next_action: input.nextAction,
    relevant_files: input.changedFiles ?? [],
    relevant_tables: input.changedTables ?? [],
    relevant_apis: input.changedApis ?? [],
    last_checkpoint_id: cp.id,
  };

  if (existing) {
    const { error: upErr } = await supabase.from("resume_packages").update(payload).eq("id", existing.id);
    if (upErr) throw upErr;
  } else {
    const { error: insErr } = await supabase.from("resume_packages").insert(payload);
    if (insErr) throw insErr;
  }

  const { error: taskErr } = await supabase
    .from("tasks")
    .update({ last_known_good_state: input.lastSuccessfulStep, next_action: input.nextAction })
    .eq("id", input.taskId);
  if (taskErr) throw taskErr;

  await logEvent({
    projectId: input.projectId,
    taskId: input.taskId,
    eventType: input.isFinal ? "final_checkpoint" : "checkpoint",
    description: input.doneSummary,
    outcome: input.nextAction,
  });

  return cp;
}

export async function changeTaskStatus(input: {
  projectId: string;
  taskId: string;
  status: TaskStatus;
  reason?: string;
}) {
  const now = new Date().toISOString();
  const patch: {
    status: TaskStatus;
    started_at?: string;
    completed_at?: string;
    cancelled_at?: string;
    deleted_at?: string;
  } = { status: input.status };
  if (input.status === "in_progress") patch.started_at = now;
  if (input.status === "completed") patch.completed_at = now;
  if (input.status === "cancelled") patch.cancelled_at = now;
  if (input.status === "soft_deleted") patch.deleted_at = now;

  const { error } = await supabase.from("tasks").update(patch).eq("id", input.taskId);
  if (error) throw error;

  if (input.status === "reopened" || input.status === "in_progress") {
    const { data: cycles } = await supabase
      .from("task_cycles")
      .select("cycle_number")
      .eq("task_id", input.taskId)
      .order("cycle_number", { ascending: false })
      .limit(1);
    const last = cycles?.[0]?.cycle_number ?? 0;
    if (input.status === "reopened" || last === 0) {
      await supabase.from("task_cycles").insert({
        project_id: input.projectId,
        task_id: input.taskId,
        cycle_number: last + 1,
        reason: input.reason ?? null,
      });
    }
  }

  if (input.status === "completed" || input.status === "cancelled") {
    const { data: rp } = await supabase
      .from("resume_packages")
      .select("id")
      .eq("task_id", input.taskId)
      .eq("is_active", true)
      .maybeSingle();
    if (rp) await supabase.from("resume_packages").update({ is_active: false }).eq("id", rp.id);
  }

  await supabase.from("task_changes").insert({
    project_id: input.projectId,
    task_id: input.taskId,
    field_name: "status",
    new_value: input.status,
    change_reason: input.reason ?? null,
  });

  await logEvent({
    projectId: input.projectId,
    taskId: input.taskId,
    eventType: `status_${input.status}`,
    description: input.reason ?? `تغيير الحالة إلى ${STATUS_LABEL[input.status]}`,
  });
}

export async function setCurrentTask(projectId: string, taskId: string | null) {
  const { error } = await supabase
    .from("project_execution_summary")
    .update({ current_task_id: taskId })
    .eq("project_id", projectId);
  if (error) throw error;
}

/** إنشاء مشروع فارغ فقط — بدون أي محتوى مزروع. الوصف والدستور والمهام تأتي من المستخدم. */
export async function bootstrapProject() {
  const existing = await getCurrentProject();
  if (existing) return existing;

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name: "مشروع جديد" })
    .select()
    .single();
  if (error) throw error;
  return project;
}
