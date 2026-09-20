import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "التقارير — السيل الجارف" },
      { name: "description", content: "تقارير دورية مبنية على السجل لا على الانطباعات." },
      { property: "og:title", content: "التقارير — السيل الجارف" },
      { property: "og:description", content: "تقارير دورية مبنية على السجل لا على الانطباعات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="التقارير"
      description="تقارير دورية مبنية على السجل لا على الانطباعات."
      layer="ai"
    />
  );
}
