import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string };
type NavGroup = { group: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    group: "البداية",
    items: [
      { to: "/home", label: "الرئيسية" },
      { to: "/chat", label: "الحوار مع AI" },
    ],
  },
  {
    group: "النظام",
    items: [
      { to: "/system", label: "السيل الجارف" },
      { to: "/versions", label: "الإصدارات" },
      { to: "/system-changes", label: "تغييرات السيل الجارف" },
    ],
  },
  {
    group: "الخطة والأوراد",
    items: [
      { to: "/plan", label: "الخطة الحالية" },
      { to: "/policies", label: "سياسات المرحلة" },
      { to: "/practices", label: "أوراد المرحلة" },
      { to: "/execution", label: "التنفيذ والتقييم" },
    ],
  },
  {
    group: "الواقع",
    items: [
      { to: "/events", label: "الأحداث" },
      { to: "/context", label: "الحالة والسياق" },
    ],
  },
  {
    group: "التحليل",
    items: [
      { to: "/gap", label: "الفجوة بين النظام والواقع" },
      { to: "/problems", label: "أكبر المشاكل" },
      { to: "/patterns", label: "الأنماط" },
      { to: "/metrics", label: "المقاييس" },
      { to: "/experiments", label: "التجارب" },
    ],
  },
  {
    group: "السجل",
    items: [
      { to: "/reports", label: "التقارير" },
      { to: "/audit", label: "سجل التدقيق" },
      { to: "/timeline", label: "الخط الزمني" },
      { to: "/archive", label: "الأرشيف" },
      { to: "/settings", label: "الإعدادات" },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const context = useRouteContext({ from: "/_authenticated" });
  const [open, setOpen] = useState(false);
  const identity = context.profile?.display_name ?? context.user?.email ?? null;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const signOut = () => {
    void (async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      window.location.href = "/auth";
    })();
  };

  return (
    <div className="min-h-svh overflow-x-hidden bg-background text-foreground">
      <div className="flex min-h-svh">
        {open && (
          <Button
            type="button"
            variant="ghost"
            aria-label="إغلاق القائمة"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 h-auto w-auto rounded-none bg-foreground/45 p-0 hover:bg-foreground/45 lg:hidden"
          />
        )}

        <aside
          aria-label="التنقل الرئيسي"
          className={cn(
            "fixed inset-y-0 right-0 z-40 flex h-dvh w-[min(18rem,calc(100vw-2rem))] shrink-0 flex-col border-s border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl transition-[transform,visibility] duration-200 ease-out lg:visible lg:sticky lg:top-0 lg:h-svh lg:w-72 lg:translate-x-0 lg:shadow-none",
            open
              ? "visible translate-x-0"
              : "invisible translate-x-full pointer-events-none lg:pointer-events-auto lg:translate-x-0",
          )}
        >
          <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-sidebar-border px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] lg:block lg:border-b-0 lg:px-6 lg:pb-0">
            <div className="min-w-0">
              <div className="truncate font-display text-base font-semibold">السيل الجارف</div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                نظام تشغيل شخصي يُختبر على الواقع عبر الزمن
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="إغلاق القائمة"
              className="shrink-0 lg:hidden"
            >
              <X />
            </Button>
          </div>

          <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {NAV_GROUPS.map((group) => (
              <div key={group.group}>
                <div className="mb-1.5 px-2 text-[11px] font-medium text-muted-foreground">
                  {group.group}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeProps={{ className: "bg-primary/10 text-primary" }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
            <div className="grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:flex sm:px-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
                aria-expanded={open}
                className="shrink-0 lg:hidden"
              >
                <Menu />
              </Button>
              <div className="flex min-w-0 items-center justify-end gap-2 sm:ms-auto">
                {identity && (
                  <span
                    className="min-w-0 truncate text-xs text-muted-foreground sm:max-w-[12rem]"
                    title={identity}
                  >
                    {identity}
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={signOut}
                aria-label="تسجيل الخروج"
                title="تسجيل الخروج"
                className="shrink-0 sm:hidden"
              >
                <LogOut />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={signOut}
                className="hidden shrink-0 sm:inline-flex"
              >
                <LogOut />
                خروج
              </Button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-6 sm:px-4 sm:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
