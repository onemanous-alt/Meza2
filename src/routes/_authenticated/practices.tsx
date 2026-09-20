import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/practices")({
  head: () => ({
    meta: [
      { title: "أوراد المرحلة — السيل الجارف" },
      { name: "description", content: "الأوراد المخطَّطة لهذه المرحلة قبل تنفيذها على الواقع." },
      { property: "og:title", content: "أوراد المرحلة — السيل الجارف" },
      { property: "og:description", content: "الأوراد المخطَّطة لهذه المرحلة قبل تنفيذها على الواقع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="أوراد المرحلة"
      description="الأوراد المخطَّطة لهذه المرحلة قبل تنفيذها على الواقع."
      layer="practice"
    />
  );
}
