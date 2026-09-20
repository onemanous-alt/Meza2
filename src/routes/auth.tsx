import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { claimUnownedProjects } from "@/lib/memory-extra";
import { ensureProfile } from "@/lib/profile";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "الدخول — الذاكرة التشغيلية للمشروع" },
      {
        name: "description",
        content: "تسجيل الدخول إلى لوحة الذاكرة التشغيلية وإدارة تنفيذ المشروع.",
      },
      { property: "og:title", content: "الدخول — الذاكرة التشغيلية للمشروع" },
      {
        property: "og:description",
        content: "تسجيل الدخول إلى لوحة الذاكرة التشغيلية وإدارة تنفيذ المشروع.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: `${window.location.origin}/` },
            });
      if (res.error) throw res.error;
      if (!res.data.session) {
        setError("تم إنشاء الحساب. سجّل الدخول الآن.");
        setMode("signin");
        return;
      }
      await ensureProfile();
      await claimUnownedProjects();
      await navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
      >
        <h1 className="font-display text-lg font-semibold">
          {mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}
        </h1>
        <p className="text-xs leading-relaxed text-muted-foreground">
          الذاكرة التشغيلية محمية بصلاحيات مالك المشروع. أول حساب يسجّل الدخول يصبح مالك بيانات
          المشروع المسجّلة.
        </p>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="البريد الإلكتروني"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? "..." : mode === "signin" ? "دخول" : "إنشاء الحساب"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "ليس لديك حساب؟ أنشئ حسابًا" : "لديك حساب؟ سجّل الدخول"}
        </button>
      </form>
    </div>
  );
}
