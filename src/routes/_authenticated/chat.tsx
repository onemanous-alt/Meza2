import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "الحوار مع AI — السيل الجارف" },
      { name: "description", content: "المدخل الأساسي للتطبيق: حوار يستخرج الوقائع ويصنّفها ويسجّلها بعد قرارك." },
      { property: "og:title", content: "الحوار مع AI — السيل الجارف" },
      { property: "og:description", content: "المدخل الأساسي للتطبيق: حوار يستخرج الوقائع ويصنّفها ويسجّلها بعد قرارك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="الحوار مع AI"
      description="المدخل الأساسي للتطبيق: حوار يستخرج الوقائع ويصنّفها ويسجّلها بعد قرارك."
      layer="ai"
    />
  );
}
