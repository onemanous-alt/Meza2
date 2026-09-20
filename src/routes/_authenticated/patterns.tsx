import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/patterns")({
  head: () => ({
    meta: [
      { title: "الأنماط — السيل الجارف" },
      { name: "description", content: "الأنماط المتكررة في تطور النظام وفي الحياة الفعلية." },
      { property: "og:title", content: "الأنماط — السيل الجارف" },
      { property: "og:description", content: "الأنماط المتكررة في تطور النظام وفي الحياة الفعلية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="الأنماط"
      description="الأنماط المتكررة في تطور النظام وفي الحياة الفعلية."
      layer="ai"
    />
  );
}
