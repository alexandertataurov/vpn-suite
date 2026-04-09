import type { ReactNode } from "react";

export interface DoDontItem {
  label: string;
  node: ReactNode;
  explanation?: string;
}

export interface UsageSectionProps {
  doItems?: DoDontItem[];
  dontItems?: DoDontItem[];
}

export function UsageSection({
  doItems = [],
  dontItems = [],
}: UsageSectionProps) {
  const hasContent = doItems.length > 0 || dontItems.length > 0;
  if (!hasContent) return null;

  return (
    <section className="docs-usage">
      <h2 className="docs-usage__title">Usage guidelines</h2>
      <div className="docs-usage__grid">
        {doItems.length > 0 && (
          <div className="docs-usage__col docs-usage__col--do">
            <h3 className="docs-usage__col-title">Do</h3>
            <div className="docs-usage__col-body">
              {doItems.map((item, i) => (
                <div key={i} className="docs-usage__item">
                  <p className="docs-usage__item-label">{item.label}</p>
                  <div className="docs-usage__item-preview">{item.node}</div>
                  {item.explanation != null && (
                    <p className="docs-usage__item-explanation">{item.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {dontItems.length > 0 && (
          <div className="docs-usage__col docs-usage__col--dont">
            <h3 className="docs-usage__col-title">Don&apos;t</h3>
            <div className="docs-usage__col-body">
              {dontItems.map((item, i) => (
                <div key={i} className="docs-usage__item">
                  <p className="docs-usage__item-label">{item.label}</p>
                  <div className="docs-usage__item-preview">{item.node}</div>
                  {item.explanation != null && (
                    <p className="docs-usage__item-explanation">{item.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
