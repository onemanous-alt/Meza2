import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "الرئيسية — السيل الجارف" },
      { name: "description", content: "لوحة بداية موجزة تعرض حالة النظام الحالية والخطوة التالية دون اعتبارها لوحة قيادة محورية." },
      { property: "og:title", content: "الرئيسية — السيل الجارف" },
      { property: "og:description", content: "لوحة بداية موجزة تعرض حالة النظام الحالية والخطوة التالية دون اعتبارها لوحة قيادة محورية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="الرئيسية"
      description="لوحة بداية موجزة تعرض حالة النظام الحالية والخطوة التالية دون اعتبارها لوحة قيادة محورية."
      layer="system"
    />
  );
}
