import type { ReactNode } from "react";

export interface UsageExampleItem {
  label: string;
  node: ReactNode;
  explanation?: string;
}

export interface UsageSectionProps {
  doItems?: UsageExampleItem[];
  dontItems?: UsageExampleItem[];
}

interface UsageExamplesColumnProps {
  items: UsageExampleItem[];
  title: string;
  tone: "do" | "dont";
}

function UsageExamplesColumn({ items, title, tone }: UsageExamplesColumnProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`docs-usage__col docs-usage__col--${tone}`}>
      <h3 className="docs-usage__col-title">{title}</h3>
      <div className="docs-usage__col-body">
        {items.map((item) => (
          <div key={item.label} className="docs-usage__item">
            <p className="docs-usage__item-label">{item.label}</p>
            <div className="docs-usage__item-preview">{item.node}</div>
            {item.explanation != null ? (
              <p className="docs-usage__item-explanation">{item.explanation}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function UsageSection({
  doItems = [],
  dontItems = [],
}: UsageSectionProps) {
  if (doItems.length === 0 && dontItems.length === 0) {
    return null;
  }

  return (
    <section className="docs-usage">
      <h2 className="docs-usage__title">Usage guidelines</h2>
      <div className="docs-usage__grid">
        <UsageExamplesColumn items={doItems} title="Do" tone="do" />
        <UsageExamplesColumn items={dontItems} title="Don't" tone="dont" />
      </div>
    </section>
  );
}
