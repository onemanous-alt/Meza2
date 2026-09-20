import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/archive")({
  head: () => ({
    meta: [
      { title: "الأرشيف — السيل الجارف" },
      { name: "description", content: "ما خرج من الاستخدام دون حذفه من التاريخ." },
      { property: "og:title", content: "الأرشيف — السيل الجارف" },
      { property: "og:description", content: "ما خرج من الاستخدام دون حذفه من التاريخ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="الأرشيف"
      description="ما خرج من الاستخدام دون حذفه من التاريخ."
      layer="system"
    />
  );
}
