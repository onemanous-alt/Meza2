import { supabase } from "@/integrations/supabase/client";

export type ProposalComponent = {
  key: string;
  title: string;
  kind: string;
  body: string;
  sort_order: number;
};

export type ProposalChange = {
  type: string;
  key: string;
  title: string;
  what_changed: string;
  advantage: string;
  evidence?: string;
};

export type ProposalRow = {
  id: string;
  system_id: string;
  base_version_id: string | null;
  parent_proposal_id: string | null;
  revision_number: number;
  status: string;
  name: string | null;
  change_summary: string;
  advantages: string | null;
  components: ProposalComponent[];
  changes: ProposalChange[];
  instruction: string | null;
  model: string | null;
  created_at: string;
};

export const CHANGE_TYPE_LABEL: Record<string, string> = {
  added: "مكوّن جديد",
  modified: "تعديل",
  removed: "حُذف",
  unchanged: "كما هو",
};

export async function listProposals(systemId: string): Promise<ProposalRow[]> {
  const { data, error } = await supabase
    .from("system_draft_proposals")
    .select(
      "id, system_id, base_version_id, parent_proposal_id, revision_number, status, name, change_summary, advantages, components, changes, instruction, model, created_at",
    )
    .eq("system_id", systemId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as unknown as ProposalRow[];
}

/** ينسخ المسودة المقترحة إلى مساحة الكتابة، ويبقى الاعتماد بيد المستخدم. */
export async function applyProposalToDraft(proposalId: string) {
  const { data, error } = await supabase.rpc("apply_proposal_to_draft", {
    _proposal_id: proposalId,
  });
  if (error) throw error;
  await supabase
    .from("system_draft_proposals")
    .update({ status: "applied" } as never)
    .eq("id", proposalId);
  return data as number;
}

export async function discardProposal(proposalId: string) {
  const { error } = await supabase
    .from("system_draft_proposals")
    .update({ status: "discarded" } as never)
    .eq("id", proposalId);
  if (error) throw error;
}
