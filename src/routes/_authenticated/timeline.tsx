import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/timeline")({
  head: () => ({
    meta: [
      { title: "الخط الزمني — السيل الجارف" },
      { name: "description", content: "كل الأحداث والقرارات والإصدارات مرتبة زمنيًا." },
      { property: "og:title", content: "الخط الزمني — السيل الجارف" },
      { property: "og:description", content: "كل الأحداث والقرارات والإصدارات مرتبة زمنيًا." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="الخط الزمني"
      description="كل الأحداث والقرارات والإصدارات مرتبة زمنيًا."
      layer="reality"
    />
  );
}
