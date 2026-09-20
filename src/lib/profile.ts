import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  timezone: string;
};

/**
 * يضمن وجود سجل profile للمستخدم الحالي دون لمس مخطط auth المحفوظ.
 * لا حذف ولا استبدال: إنشاء عند الغياب فقط.
 */
export async function ensureProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, user_id, display_name, timezone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return existing as Profile;

  const fallbackName =
    (user.user_metadata?.["display_name"] as string | undefined) ??
    user.email?.split("@")[0] ??
    "مستخدم";

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({ user_id: user.id, display_name: fallbackName })
    .select("id, user_id, display_name, timezone")
    .maybeSingle();

  if (error) return null;
  return (created as Profile) ?? null;
}

export async function updateDisplayName(displayName: string) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error("لا جلسة نشطة");
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("user_id", uid);
  if (error) throw error;
}
