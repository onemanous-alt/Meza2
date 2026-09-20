import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/gap")({
  head: () => ({
    meta: [
      { title: "الفجوة بين النظام والواقع — السيل الجارف" },
      { name: "description", content: "المقارنة بين المخطط والواقع مع تحليل الأسباب لا الحكم بالفشل." },
      { property: "og:title", content: "الفجوة بين النظام والواقع — السيل الجارف" },
      { property: "og:description", content: "المقارنة بين المخطط والواقع مع تحليل الأسباب لا الحكم بالفشل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="الفجوة بين النظام والواقع"
      description="المقارنة بين المخطط والواقع مع تحليل الأسباب لا الحكم بالفشل."
      layer="ai"
    />
  );
}
