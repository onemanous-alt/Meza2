import { createFileRoute } from "@tanstack/react-router";

import { SectionPlaceholder } from "@/components/section-placeholder";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — السيل الجارف" },
      { name: "description", content: "إعدادات الحساب والعرض وتفضيلات التطبيق." },
      { property: "og:title", content: "الإعدادات — السيل الجارف" },
      { property: "og:description", content: "إعدادات الحساب والعرض وتفضيلات التطبيق." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SectionPlaceholder
      title="الإعدادات"
      description="إعدادات الحساب والعرض وتفضيلات التطبيق."
      layer="system"
    />
  );
}
