import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { NoteBanner, PageHeader, Panel, Section, StatusBadge } from "@/components/layer-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { generateSystemProposal } from "@/lib/system-proposal.functions";
import {
  CHANGE_TYPE_LABEL,
  applyProposalToDraft,
  discardProposal,
  listProposals,
  type ProposalRow,
} from "@/lib/system-proposal";
import {
  COMPONENT_KINDS,
  addDraftComponent,
  deleteDraftComponent,
  getCurrentVersion,
  getOrCreateSystem,
  kindLabel,
  listDraft,
  normalizeKeys,
  publishVersion,
  snapshotComponents,
  updateDraftComponent,
  type DraftComponent,
} from "@/lib/system";

export const Route = createFileRoute("/_authenticated/system")({
  head: () => ({
    meta: [
      { title: "السيل الجارف — النظام التشغيلي" },
      { name: "description", content: "اكتب مكوّنات نظامك التشغيلي بنفسك واعتمدها كنسخة رسمية مرقّمة." },
      { property: "og:title", content: "السيل الجارف — النظام التشغيلي" },
      { property: "og:description", content: "اكتب مكوّنات نظامك التشغيلي بنفسك واعتمدها كنسخة رسمية مرقّمة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const systemQuery = useQuery({ queryKey: ["system"], queryFn: getOrCreateSystem });
  const systemId = systemQuery.data?.id;

  const draftQuery = useQuery({
    queryKey: ["system-draft", systemId],
    queryFn: () => listDraft(systemId!),
    enabled: !!systemId,
  });
  const currentQuery = useQuery({
    queryKey: ["system-current", systemId],
    queryFn: () => getCurrentVersion(systemId!),
    enabled: !!systemId,
  });

  const [publishOpen, setPublishOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [versionName, setVersionName] = useState("");

  const addMutation = useMutation({
    mutationFn: () => addDraftComponent(systemId!, draftQuery.data ?? []),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system-draft", systemId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDraftComponent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system-draft", systemId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      await normalizeKeys(draftQuery.data ?? []);
      return publishVersion({
        systemId: systemId!,
        changeSummary: summary.trim(),
        name: versionName.trim() || null,
      });
    },
    onSuccess: async () => {
      setPublishOpen(false);
      setSummary("");
      setVersionName("");
      toast.success("تم اعتماد النسخة وحفظها في السجل");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["system-current", systemId] }),
        qc.invalidateQueries({ queryKey: ["system-draft", systemId] }),
        qc.invalidateQueries({ queryKey: ["system-versions", systemId] }),
      ]);
    },
    onError: (e: Error) => toast.error(translateError(e.message)),
  });

  const draft = draftQuery.data ?? [];
  const current = currentQuery.data ?? null;
  const currentComponents = snapshotComponents(current?.version);

  const manualPhase = !current;

  return (
    <div className="space-y-6">
      <PageHeader
        title="السيل الجارف"
        description={
          manualPhase
            ? "نسخة الانطلاق فقط تُكتب بيدك: اكتب مكوّناتك ثم اعتمدها كنسخة 1."
            : "بعد نسخة الانطلاق لا تكتب شيئًا: المسودة تُكتب من النظام ومن محادثة الذكاء الاصطناعي، وأنت تضغط الاعتماد فقط."
        }
        layer="system"
        actions={
          <div className="flex items-center gap-2">
            {current && (
              <StatusBadge status={`النسخة الحالية: ${current.version.version_number}`} />
            )}
            {manualPhase && (
              <Button
                onClick={() => setPublishOpen(true)}
                disabled={!systemId || draft.filter((d) => d.status === "active").length === 0}
              >
                اعتماد كنسخة 1
              </Button>
            )}
          </div>
        }
      />

      {systemQuery.isError && (
        <Panel tint="system">
          <NoteBanner>تعذّر فتح النظام: {(systemQuery.error as Error).message}</NoteBanner>
        </Panel>
      )}

      <Tabs defaultValue={manualPhase ? "draft" : "proposal"} dir="rtl">
        <TabsList>
          <TabsTrigger value="draft">
            {manualPhase ? "المسودة (قابلة للكتابة)" : "المسودة (للقراءة فقط)"}
          </TabsTrigger>
          <TabsTrigger value="proposal">مسودة مقترحة تلقائيًا</TabsTrigger>
          <TabsTrigger value="current">النسخة المعتمدة</TabsTrigger>
        </TabsList>

        <TabsContent value="proposal" className="mt-5">
          <ProposalTab {...(systemId ? { systemId } : {})} hasVersion={!!current} />
        </TabsContent>

        <TabsContent value="draft" className="mt-5">
          <Section
            title="مكوّنات نظامك"
            hint={
              manualPhase
                ? "المسودة مساحة عمل حرّة: التعديل هنا لا يغيّر أي نسخة معتمدة سابقة."
                : "الكتابة اليدوية مغلقة بعد نسخة 1. ما تراه هنا نسخة عمل تُكتب تلقائيًا، والاعتماد يتم من تبويب المسودة المقترحة."
            }
            actions={
              manualPhase ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMutation.mutate()}
                  disabled={!systemId || addMutation.isPending}
                >
                  + إضافة مكوّن
                </Button>
              ) : undefined
            }
          >
            {draftQuery.isLoading && (
              <Panel tint="system">
                <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
              </Panel>
            )}
            {!draftQuery.isLoading && draft.length === 0 && (
              <Panel tint="system">
                <NoteBanner>
                  {manualPhase
                    ? "لا توجد مكوّنات بعد. اضغط «إضافة مكوّن» وابدأ بكتابة نظامك كما تعمل به الآن."
                    : "لا توجد مكوّنات في نسخة العمل الآن."}
                </NoteBanner>
              </Panel>
            )}
            <div className="space-y-4">
              {draft.map((item) =>
                manualPhase ? (
                  <DraftCard
                    key={item.id}
                    item={item}
                    onDelete={() => deleteMutation.mutate(item.id)}
                    onSaved={() => qc.invalidateQueries({ queryKey: ["system-draft", systemId] })}
                  />
                ) : (
                  <Panel key={item.id} tint="system">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <StatusBadge status={kindLabel(item.kind)} />
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </Panel>
                ),
              )}
            </div>
          </Section>
        </TabsContent>


        <TabsContent value="current" className="mt-5">
          {!current && (
            <Panel tint="system">
              <NoteBanner>لم تُعتمد أي نسخة بعد. اكتب مكوّناتك في المسودة ثم اعتمدها كنسخة 1.</NoteBanner>
            </Panel>
          )}
          {current && (
            <div className="space-y-4">
              <Panel tint="system">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <StatusBadge status={`نسخة ${current.version.version_number}`} />
                  {current.version.name && <span className="font-medium">{current.version.name}</span>}
                  <span className="text-muted-foreground">
                    اعتُمدت في {formatDate(current.adoption.occurred_at)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {current.version.change_summary}
                </p>
              </Panel>
              {currentComponents.map((c) => (
                <Panel key={c.key} tint="system">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{c.title}</h3>
                    <StatusBadge status={kindLabel(c.kind)} />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {c.definition?.body ?? ""}
                  </p>
                </Panel>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>اعتماد النسخة</DialogTitle>
            <DialogDescription>
              سيتم حفظ المسودة الحالية كنسخة رسمية مرقّمة مع حدث اعتماد مؤرّخ. لا يمكن تعديلها أو حذفها بعد ذلك.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="version-name">اسم النسخة (اختياري)</Label>
              <Input
                id="version-name"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="مثال: النسخة الأساسية"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">سبب/ملخص التغيير (إلزامي)</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                placeholder="ما الذي تعتمده الآن ولماذا؟"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={summary.trim().length === 0 || publishMutation.isPending}
            >
              {publishMutation.isPending ? "جارٍ الاعتماد…" : "اعتماد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DraftCard({
  item,
  onDelete,
  onSaved,
}: {
  item: DraftComponent;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);
  const [kind, setKind] = useState(item.kind);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(item.title);
    setBody(item.body);
    setKind(item.kind);
  }, [item.id, item.title, item.body, item.kind]);

  const save = async (patch: Partial<DraftComponent>) => {
    setSaving(true);
    try {
      await updateDraftComponent(item.id, patch);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel tint="system">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title !== item.title && title.trim() && void save({ title: title.trim() })}
          className="h-9 max-w-sm font-medium"
          placeholder="عنوان المكوّن"
        />
        <Select
          value={kind}
          onValueChange={(v) => {
            setKind(v);
            void save({ kind: v });
          }}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMPONENT_KINDS.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ms-auto flex items-center gap-2 text-[11px] text-muted-foreground">
          {saving ? "جارٍ الحفظ…" : "محفوظ"}
          <Button variant="ghost" size="sm" onClick={onDelete}>
            حذف
          </Button>
        </span>
      </div>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onBlur={() => body !== item.body && void save({ body })}
        rows={6}
        className="mt-3 leading-relaxed"
        placeholder="اكتب نص هذا المكوّن كما تعمل به فعلًا…"
      />
    </Panel>
  );
}

function ProposalTab({ systemId, hasVersion }: { systemId?: string; hasVersion: boolean }) {
  const qc = useQueryClient();
  const generate = useServerFn(generateSystemProposal);
  const [instruction, setInstruction] = useState("");

  const proposalsQuery = useQuery({
    queryKey: ["system-proposals", systemId],
    queryFn: () => listProposals(systemId!),
    enabled: !!systemId,
  });

  const latest = (proposalsQuery.data ?? []).find(
    (p) => p.status === "pending" || p.status === "applied",
  );

  const generateMutation = useMutation({
    mutationFn: (parentProposalId?: string) =>
      generate({
        data: {
          systemId: systemId!,
          ...(instruction.trim() ? { instruction: instruction.trim() } : {}),
          ...(parentProposalId ? { parentProposalId } : {}),
        },
      }),
    onSuccess: async () => {
      setInstruction("");
      toast.success("تمت كتابة المسودة المقترحة — راجعها ثم اعتمدها");
      await qc.invalidateQueries({ queryKey: ["system-proposals", systemId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const adoptMutation = useMutation({
    mutationFn: async (proposal: ProposalRow) => {
      await applyProposalToDraft(proposal.id);
      const draft = await listDraft(systemId!);
      await normalizeKeys(draft);
      return publishVersion({
        systemId: systemId!,
        changeSummary: proposal.change_summary,
        name: proposal.name,
      });
    },
    onSuccess: async () => {
      toast.success("تم الاعتماد وحفظ النسخة الرسمية");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["system-draft", systemId] }),
        qc.invalidateQueries({ queryKey: ["system-proposals", systemId] }),
        qc.invalidateQueries({ queryKey: ["system-current", systemId] }),
        qc.invalidateQueries({ queryKey: ["system-versions", systemId] }),
      ]);
    },
    onError: (e: Error) => toast.error(translateError(e.message)),
  });


  const discardMutation = useMutation({
    mutationFn: (id: string) => discardProposal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system-proposals", systemId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Panel tint="ai">
        <p className="text-sm leading-relaxed text-muted-foreground">
          بعد نسخة الانطلاق لا تكتب النظام يدويًا: هنا يكتب الذكاء الاصطناعي المسودة استنادًا إلى
          النسخة المعتمدة وما سُجّل فعلًا من أحداث وقرارات، ويوضح ما تغيّر ومزيّته. المسودة مجرد
          اقتراح، ولا تصبح نسخة رسمية إلا باعتمادك.
        </p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="instruction">توجيهك للذكاء الاصطناعي (اختياري)</Label>
          <Textarea
            id="instruction"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={3}
            placeholder="مثال: اجعل ورد الفجر أوضح، واحذف ما لم أعمل به فعلًا."
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={() => generateMutation.mutate(undefined)}
            disabled={!systemId || !hasVersion || generateMutation.isPending}
          >
            {generateMutation.isPending ? "جارٍ الكتابة…" : "اكتب مسودة جديدة"}
          </Button>
          {latest && (
            <Button
              variant="outline"
              onClick={() => generateMutation.mutate(latest.id)}
              disabled={generateMutation.isPending}
            >
              عدّل المسودة الحالية بتوجيهي
            </Button>
          )}
        </div>
        {!hasVersion && (
          <NoteBanner>
            التوليد التلقائي يقايس الفروق على نسخة معتمدة، فاعتمد نسخة الانطلاق أولًا من تبويب
            المسودة.
          </NoteBanner>
        )}
      </Panel>

      {proposalsQuery.isLoading && (
        <Panel tint="ai">
          <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
        </Panel>
      )}

      {!proposalsQuery.isLoading && (proposalsQuery.data ?? []).length === 0 && (
        <Panel tint="ai">
          <NoteBanner>لا توجد مسودات مقترحة بعد.</NoteBanner>
        </Panel>
      )}

      {(proposalsQuery.data ?? []).map((p) => (
        <ProposalCard
          key={p.id}
          proposal={p}
          onAdopt={() => adoptMutation.mutate(p)}
          onDiscard={() => discardMutation.mutate(p.id)}
          busy={adoptMutation.isPending || discardMutation.isPending}
        />
      ))}
    </div>
  );
}

const PROPOSAL_STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار اعتمادك",
  applied: "اعتُمدت",
  discarded: "مستبعدة",
  superseded: "تجاوزتها مسودة أحدث",
};

const CHANGE_TYPE_STYLE: Record<string, string> = {
  added: "border-primary/50 bg-primary/5",
  modified: "border-accent-foreground/30 bg-accent/40",
  removed: "border-destructive/50 bg-destructive/5",
  unchanged: "border-border/50 opacity-70",
};

function ProposalCard({
  proposal,
  onAdopt,
  onDiscard,
  busy,
}: {
  proposal: ProposalRow;
  onAdopt: () => void;
  onDiscard: () => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const allChanges = Array.isArray(proposal.changes) ? proposal.changes : [];
  const changed = allChanges.filter((c) => c.type !== "unchanged");
  const unchanged = allChanges.filter((c) => c.type === "unchanged");
  const components = Array.isArray(proposal.components) ? proposal.components : [];

  const counts = {
    added: changed.filter((c) => c.type === "added").length,
    modified: changed.filter((c) => c.type === "modified").length,
    removed: changed.filter((c) => c.type === "removed").length,
  };

  return (
    <Panel tint="ai">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={PROPOSAL_STATUS_LABEL[proposal.status] ?? proposal.status} />
        {proposal.name && <span className="text-sm font-semibold">{proposal.name}</span>}
        <span className="text-[11px] text-muted-foreground">
          مراجعة {proposal.revision_number} — {formatDate(proposal.created_at)}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed">{proposal.change_summary}</p>
      {proposal.advantages && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          المزايا: {proposal.advantages}
        </p>
      )}
      {proposal.instruction && (
        <p className="mt-2 text-[12px] text-muted-foreground">توجيهك: {proposal.instruction}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-full border border-primary/50 bg-primary/5 px-2 py-0.5">
          جديد: {counts.added}
        </span>
        <span className="rounded-full border border-accent-foreground/30 bg-accent/40 px-2 py-0.5">
          مُعدّل: {counts.modified}
        </span>
        <span className="rounded-full border border-destructive/50 bg-destructive/5 px-2 py-0.5">
          محذوف: {counts.removed}
        </span>
        <span className="rounded-full border border-border/50 px-2 py-0.5 text-muted-foreground">
          كما هو: {unchanged.length}
        </span>
      </div>

      {changed.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold">نقاط التغيير</h4>
          {changed.map((c, i) => (
            <div
              key={`${c.key}-${i}`}
              className={`rounded-md border p-3 ${CHANGE_TYPE_STYLE[c.type] ?? "border-border/60"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={CHANGE_TYPE_LABEL[c.type] ?? c.type} />
                <span className="text-sm font-medium">{c.title || c.key}</span>
              </div>
              {c.what_changed && (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.what_changed}</p>
              )}
              {c.advantage && (
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  الميزة: {c.advantage}
                </p>
              )}
              {c.evidence && (
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  الدليل: {c.evidence}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {changed.length === 0 && (
        <NoteBanner>لا توجد نقاط تغيير في هذه المسودة — النظام كما هو.</NoteBanner>
      )}

      {unchanged.length > 0 && (
        <div className="mt-3">
          <Button variant="ghost" size="sm" onClick={() => setShowUnchanged((v) => !v)}>
            {showUnchanged
              ? "إخفاء ما لم يتغيّر"
              : `عرض ما لم يتغيّر (${unchanged.length} مكوّنًا)`}
          </Button>
          {showUnchanged && (
            <div className="mt-2 space-y-1">
              {unchanged.map((c, i) => (
                <p key={`${c.key}-u-${i}`} className="text-[12px] text-muted-foreground">
                  • {c.title || c.key}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? "إخفاء النص الكامل" : `عرض النص الكامل (${components.length} مكوّنًا)`}
        </Button>
        {proposal.status === "pending" && (
          <>
            <Button size="sm" onClick={onAdopt} disabled={busy}>
              {busy ? "جارٍ الاعتماد…" : "اعتماد"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDiscard} disabled={busy}>
              استبعاد
            </Button>
          </>
        )}
      </div>


      {open && (
        <div className="mt-4 space-y-3">
          {components.map((c) => (
            <div key={c.key} className="rounded-md border border-border/60 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{c.title}</span>
                <StatusBadge status={kindLabel(c.kind)} />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
}

function translateError(message: string) {
  if (message.includes("draft is empty")) return "المسودة فارغة — أضف مكوّنًا واحدًا على الأقل.";
  if (message.includes("change summary")) return "اكتب ملخص التغيير قبل الاعتماد.";
  return message;
}
