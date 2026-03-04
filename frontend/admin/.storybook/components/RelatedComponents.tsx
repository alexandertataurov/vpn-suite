export interface RelatedComponent {
  name: string;
  description: string;
  href: string;
}

export interface RelatedComponentsProps {
  items: RelatedComponent[];
  title?: string;
}

export function RelatedComponents({
  items,
  title = "Related Components",
}: RelatedComponentsProps) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="block rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent-border)] hover:bg-[var(--color-elevated)]"
          >
            <h3 className="mb-1 text-sm font-semibold text-[var(--color-text-accent)]">{item.name}</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">{item.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
