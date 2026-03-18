export interface KnownLimitationsBlockProps {
  items: string[];
  title?: string;
}

export function KnownLimitationsBlock({
  items,
  title = "Known limitations",
}: KnownLimitationsBlockProps) {
  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
        {title}
      </h2>
      <ul className="list-disc space-y-2 pl-6 text-sm text-[var(--color-text-secondary)]">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
