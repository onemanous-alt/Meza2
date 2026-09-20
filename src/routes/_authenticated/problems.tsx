import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/problems")({
  head: () => ({
    meta: [
      { title: "أكبر المشاكل — السيل الجارف" },
      { name: "description", content: "المشاكل المتكررة الأكثر أثرًا بترتيب واضح وأدلة." },
      { property: "og:title", content: "أكبر المشاكل — السيل الجارف" },
      { property: "og:description", content: "المشاكل المتكررة الأكثر أثرًا بترتيب واضح وأدلة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="أكبر المشاكل"
      description="المشاكل المتكررة الأكثر أثرًا بترتيب واضح وأدلة."
      layer="ai"
    />
  );
}
