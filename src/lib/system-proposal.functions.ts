import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "google/gemini-2.5-flash";

const inputSchema = z.object({
  systemId: z.string().uuid(),
  instruction: z.string().max(4000).optional(),
  parentProposalId: z.string().uuid().optional(),
});

type ProposalComponent = {
  key: string;
  title: string;
  kind: string;
  body: string;
  sort_order: number;
};

type ProposalChange = {
  type: string;
  key: string;
  title: string;
  what_changed: string;
  advantage: string;
  evidence?: string;
};

type BaseVersion = {
  id: string;
  version_number: number;
  change_summary: string;
  snapshot: unknown;
};

type ParentProposal = {
  change_summary: string;
  components: unknown;
  revision_number: number;
};

const ALLOWED_KINDS = ["principle", "rule", "practice", "process", "structure", "other"];

function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("لم يُرجع المولّد مسودة قابلة للقراءة");
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * يولّد مسودة نظام مقترحة (PROPOSAL) بناءً على النسخة المعتمدة الحالية
 * وما سُجّل فعلًا في الذاكرة التشغيلية. لا يعتمد أي نسخة ولا يعدّل التاريخ.
 */
export const generateSystemProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("خدمة الذكاء الاصطناعي غير مُهيّأة (LOVABLE_API_KEY مفقود)");

    const supabase = context.supabase;

    const { data: system, error: systemError } = await supabase
      .from("operating_systems")
      .select("id, name, description")
      .eq("id", data.systemId)
      .maybeSingle();
    if (systemError) throw systemError;
    if (!system) throw new Error("النظام غير موجود");

    const { data: adoptions, error: adoptionError } = await supabase
      .from("version_adoptions")
      .select("system_version_id, occurred_at, sequence_no")
      .eq("system_id", data.systemId)
      .order("sequence_no", { ascending: false })
      .limit(1);
    if (adoptionError) throw adoptionError;
    const adoption = adoptions?.[0] ?? null;

    let baseVersion: BaseVersion | null = null;
    if (adoption) {
      const { data: version, error: versionError } = await supabase
        .from("system_versions")
        .select("id, version_number, change_summary, snapshot")
        .eq("id", adoption.system_version_id)
        .maybeSingle();
      if (versionError) throw versionError;
      baseVersion = (version as BaseVersion | null) ?? null;
    }

    if (!baseVersion) {
      throw new Error(
        "لا توجد نسخة انطلاق معتمدة بعد. التوليد التلقائي يقايس الفروق على نسخة معتمدة، فاعتمد نسخة الانطلاق أولًا.",
      );
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, name")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    let logs: unknown[] = [];
    let decisions: unknown[] = [];
    let checkpoints: unknown[] = [];
    if (project?.id) {
      const [logsRes, decisionsRes, checkpointsRes] = await Promise.all([
        supabase
          .from("execution_logs")
          .select("event_type, description, outcome, created_at")
          .eq("project_id", project.id)
          .gte("created_at", adoption?.occurred_at ?? baseVersion.id)
          .order("created_at", { ascending: false })
          .limit(40),
        supabase
          .from("project_decisions")
          .select("title, decision, reason, impact, status, decided_at")
          .eq("project_id", project.id)
          .eq("status", "active")
          .order("decided_at", { ascending: false })
          .limit(20),
        supabase
          .from("checkpoints")
          .select("done_summary, remaining, next_action, decisions, issues, created_at")
          .eq("project_id", project.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      logs = logsRes.data ?? [];
      decisions = decisionsRes.data ?? [];
      checkpoints = checkpointsRes.data ?? [];
    }

    let parent: ParentProposal | null = null;
    if (data.parentProposalId) {
      const { data: parentRow, error: parentError } = await supabase
        .from("system_draft_proposals")
        .select("change_summary, components, revision_number")
        .eq("id", data.parentProposalId)
        .maybeSingle();
      if (parentError) throw parentError;
      parent = (parentRow as ParentProposal | null) ?? null;
    }

    const systemPrompt = [
      "أنت مساعد يكتب مسودة مقترحة لنظام تشغيلي شخصي اسمه «السيل الجارف».",
      "المسودة اقتراح (PROPOSAL) لا سجل رسمي؛ المستخدم وحده يعتمدها.",
      "لا تخترع وقائع: اعتمد فقط على النسخة المعتمدة وما سُجّل من أحداث وقرارات ونقاط حفظ وتوجيه المستخدم.",
      "ابقِ كل مكوّن لم يستدعِ الواقع تغييره كما هو حرفيًا بنفس المفتاح.",
      "أعِد JSON فقط بهذه البنية:",
      '{"name":string,"change_summary":string,"advantages":string,"components":[{"key":string,"title":string,"kind":"principle|rule|practice|process|structure|other","body":string,"sort_order":number}],"changes":[{"type":"added|modified|removed|unchanged","key":string,"title":string,"what_changed":string,"advantage":string,"evidence":string}]}',
      "components يجب أن تمثّل النظام الكامل بعد التعديل (وليس الفروق فقط).",
      "اكتب كل النصوص بالعربية.",
    ].join("\n");

    const userPrompt = JSON.stringify(
      {
        النظام: { الاسم: system.name, الوصف: system.description },
        النسخة_المعتمدة: {
          رقمها: baseVersion.version_number,
          ملخصها: baseVersion.change_summary,
          مكوّناتها: baseVersion.snapshot,
        },
        ما_سُجّل_من_أحداث: logs,
        القرارات_النشطة: decisions,
        نقاط_الحفظ: checkpoints,
        مسودة_سابقة_للتعديل: parent,
        توجيه_المستخدم: data.instruction ?? null,
      },
      null,
      1,
    );

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (response.status === 429) throw new Error("تم تجاوز حد الاستخدام مؤقتًا، أعد المحاولة بعد قليل.");
    if (response.status === 402) throw new Error("رصيد الذكاء الاصطناعي غير كافٍ لإتمام التوليد.");
    if (!response.ok) {
      throw new Error(`تعذّر التوليد (${response.status})`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(content) as {
      name?: string;
      change_summary?: string;
      advantages?: string;
      components?: ProposalComponent[];
      changes?: ProposalChange[];
    };

    const components = (parsed.components ?? [])
      .filter((c) => c && typeof c.title === "string" && c.title.trim().length > 0)
      .map((c, i) => ({
        key: (c.key ?? "").trim() || `component-${i + 1}`,
        title: c.title.trim(),
        kind: ALLOWED_KINDS.includes(c.kind) ? c.kind : "principle",
        body: typeof c.body === "string" ? c.body : "",
        sort_order: Number.isFinite(c.sort_order) ? Number(c.sort_order) : (i + 1) * 10,
      }));

    if (components.length === 0) throw new Error("المسودة المولّدة جاءت فارغة، أعد المحاولة بتوجيه أوضح.");

    const changeSummary =
      (parsed.change_summary ?? "").trim() || "مسودة مقترحة مبنية على ما سُجّل بعد النسخة المعتمدة.";

    const { data: inserted, error: insertError } = await supabase
      .from("system_draft_proposals")
      .insert({
        system_id: data.systemId,
        base_version_id: baseVersion.id,
        parent_proposal_id: data.parentProposalId ?? null,
        revision_number: (parent?.revision_number ?? 0) + 1,
        status: "pending",
        name: (parsed.name ?? "").trim() || null,
        change_summary: changeSummary,
        advantages: (parsed.advantages ?? "").trim() || null,
        components,
        changes: parsed.changes ?? [],
        instruction: data.instruction ?? null,
        source_evidence: {
          base_version_number: baseVersion.version_number,
          logs_count: logs.length,
          decisions_count: decisions.length,
          checkpoints_count: checkpoints.length,
          project_id: project?.id ?? null,
        },
        model: MODEL,
        recorded_by: "ai",
        source: "chat_ai",
      } as never)
      .select("id")
      .single();
    if (insertError) throw insertError;

    if (data.parentProposalId) {
      await supabase
        .from("system_draft_proposals")
        .update({ status: "superseded" } as never)
        .eq("id", data.parentProposalId)
        .eq("status", "pending");
    }

    return { id: (inserted as { id: string }).id };
  });
