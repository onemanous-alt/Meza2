import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/context")({
  head: () => ({
    meta: [
      { title: "الحالة والسياق — السيل الجارف" },
      { name: "description", content: "الظروف والحالات المحيطة التي أثّرت في التنفيذ." },
      { property: "og:title", content: "الحالة والسياق — السيل الجارف" },
      { property: "og:description", content: "الظروف والحالات المحيطة التي أثّرت في التنفيذ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="الحالة والسياق"
      description="الظروف والحالات المحيطة التي أثّرت في التنفيذ."
      layer="reality"
    />
  );
}
