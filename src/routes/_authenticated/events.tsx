import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [
      { title: "الأحداث — السيل الجارف" },
      { name: "description", content: "الواقع الفعلي كما حدث، بزمن حدوثه وزمن تسجيله." },
      { property: "og:title", content: "الأحداث — السيل الجارف" },
      { property: "og:description", content: "الواقع الفعلي كما حدث، بزمن حدوثه وزمن تسجيله." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="الأحداث"
      description="الواقع الفعلي كما حدث، بزمن حدوثه وزمن تسجيله."
      layer="reality"
    />
  );
}
