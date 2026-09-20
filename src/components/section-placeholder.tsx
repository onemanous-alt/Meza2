import { NoteBanner, PageHeader, Panel } from "@/components/layer-ui";
import type { LayerKey } from "@/components/layer-ui";

export function SectionPlaceholder({
  title,
  description,
  layer,
  note,
}: {
  title: string;
  description: string;
  layer?: LayerKey;
  note?: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} layer={layer} />
      <Panel tint={layer}>
        <NoteBanner>
          {note ?? "هذا القسم جاهز في هيكل الواجهة، ومحتواه يُبنى في مهمة لاحقة من خطة التنفيذ."}
        </NoteBanner>
      </Panel>
    </div>
  );
}
