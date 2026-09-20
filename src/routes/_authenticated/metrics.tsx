import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/metrics")({
  head: () => ({
    meta: [
      { title: "المقاييس — السيل الجارف" },
      { name: "description", content: "المؤشرات المتابعة عبر الزمن ومصادر أرقامها." },
      { property: "og:title", content: "المقاييس — السيل الجارف" },
      { property: "og:description", content: "المؤشرات المتابعة عبر الزمن ومصادر أرقامها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="المقاييس"
      description="المؤشرات المتابعة عبر الزمن ومصادر أرقامها."
      layer="ai"
    />
  );
}
