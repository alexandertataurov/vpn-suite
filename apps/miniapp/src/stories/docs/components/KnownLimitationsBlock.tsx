export interface KnownLimitationsBlockProps {
  items: string[];
  title?: string;
}

export function KnownLimitationsBlock({
  items,
  title = "Known limitations",
}: KnownLimitationsBlockProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="docs-limitations">
      <h2 className="docs-limitations__title">{title}</h2>
      <ul className="docs-limitations__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
