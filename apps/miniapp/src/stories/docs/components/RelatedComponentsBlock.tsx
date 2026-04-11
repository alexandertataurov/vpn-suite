export interface RelatedComponentLink {
  label: string;
  href: string;
  description?: string;
}

export interface RelatedComponentsBlockProps {
  items: RelatedComponentLink[];
  title?: string;
}

export function RelatedComponentsBlock({
  items,
  title = "Related components",
}: RelatedComponentsBlockProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="docs-related">
      <h2 className="docs-related__title">{title}</h2>
      <div className="docs-related__grid">
        {items.map((item) => (
          <a key={item.href} href={item.href} className="docs-related__link">
            <span className="docs-related__label">{item.label}</span>
            {item.description != null ? (
              <span className="docs-related__desc">{item.description}</span>
            ) : null}
          </a>
        ))}
      </div>
    </section>
  );
}
