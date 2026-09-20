import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/execution")({
  head: () => ({
    meta: [
      { title: "التنفيذ والتقييم — السيل الجارف" },
      { name: "description", content: "ما نُفِّذ فعلًا من الأوراد وتقييمه دون إعادة كتابة الخطة." },
      { property: "og:title", content: "التنفيذ والتقييم — السيل الجارف" },
      { property: "og:description", content: "ما نُفِّذ فعلًا من الأوراد وتقييمه دون إعادة كتابة الخطة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="التنفيذ والتقييم"
      description="ما نُفِّذ فعلًا من الأوراد وتقييمه دون إعادة كتابة الخطة."
      layer="practice"
    />
  );
}
