export interface WhenToUseBlockProps {
  whenToUse?: string[];
  whenNotToUse?: string[];
}

interface GuidanceListProps {
  items: string[];
  title: string;
  tone: "do" | "dont";
}

function GuidanceList({ items, title, tone }: GuidanceListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`docs-when-to-use__col docs-when-to-use__col--${tone}`}>
      <h3 className="docs-when-to-use__col-title">{title}</h3>
      <ul className="docs-when-to-use__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function WhenToUseBlock({
  whenToUse = [],
  whenNotToUse = [],
}: WhenToUseBlockProps) {
  if (whenToUse.length === 0 && whenNotToUse.length === 0) {
    return null;
  }

  return (
    <section className="docs-when-to-use">
      <h2 className="docs-when-to-use__title">When to use</h2>
      <div className="docs-when-to-use__grid">
        <GuidanceList items={whenToUse} title="Use when" tone="do" />
        <GuidanceList items={whenNotToUse} title="Avoid when" tone="dont" />
      </div>
    </section>
  );
}
