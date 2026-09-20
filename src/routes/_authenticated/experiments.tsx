import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/experiments")({
  head: () => ({
    meta: [
      { title: "التجارب — السيل الجارف" },
      { name: "description", content: "التجارب المقصودة لاختبار فرضيات محددة ونتائجها." },
      { property: "og:title", content: "التجارب — السيل الجارف" },
      { property: "og:description", content: "التجارب المقصودة لاختبار فرضيات محددة ونتائجها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="التجارب"
      description="التجارب المقصودة لاختبار فرضيات محددة ونتائجها."
      layer="reality"
    />
  );
}
