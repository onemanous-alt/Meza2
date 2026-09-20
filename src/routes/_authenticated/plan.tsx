import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/plan")({
  head: () => ({
    meta: [
      { title: "الخطة الحالية — السيل الجارف" },
      { name: "description", content: "الخطة السارية الآن، منفصلة تمامًا عن إصدار النظام." },
      { property: "og:title", content: "الخطة الحالية — السيل الجارف" },
      { property: "og:description", content: "الخطة السارية الآن، منفصلة تمامًا عن إصدار النظام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="الخطة الحالية"
      description="الخطة السارية الآن، منفصلة تمامًا عن إصدار النظام."
      layer="plan"
    />
  );
}
