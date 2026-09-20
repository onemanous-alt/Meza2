import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/policies")({
  head: () => ({
    meta: [
      { title: "سياسات المرحلة — السيل الجارف" },
      { name: "description", content: "القواعد المطبَّقة في المرحلة الحالية وحدودها الزمنية." },
      { property: "og:title", content: "سياسات المرحلة — السيل الجارف" },
      { property: "og:description", content: "القواعد المطبَّقة في المرحلة الحالية وحدودها الزمنية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="سياسات المرحلة"
      description="القواعد المطبَّقة في المرحلة الحالية وحدودها الزمنية."
      layer="plan"
    />
  );
}
