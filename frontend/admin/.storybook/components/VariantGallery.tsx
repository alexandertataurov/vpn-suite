import { useState, type ReactNode } from "react";

export interface VariantCell {
  name: string;
  propValue?: string;
  node: ReactNode;
  darkMode?: boolean;
}

export interface VariantGalleryProps {
  title?: string;
  cells: VariantCell[];
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function VariantGallery({ title = "Variant Gallery", cells, columns = 4 }: VariantGalleryProps) {
  const [darkIndexes, setDarkIndexes] = useState<Set<number>>(new Set());

  const toggleDark = (i: number) => {
    setDarkIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`flex flex-col rounded border border-[var(--color-border-subtle)] p-4 transition-colors ${
              darkIndexes.has(i) ? "bg-[var(--color-void)]" : "bg-[var(--color-surface)]"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {cell.name}
              </span>
              <button
                type="button"
                onClick={() => toggleDark(i)}
                className="rounded border border-[var(--color-border-subtle)] px-2 py-0.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-elevated)]"
              >
                {darkIndexes.has(i) ? "Light" : "Dark"}
              </button>
            </div>
            <div className="mb-2 flex min-h-[48px] items-center justify-center">
              {cell.node}
            </div>
            {cell.propValue && (
              <code className="rounded bg-[var(--color-base)] px-2 py-1 text-xs text-[var(--color-text-accent)]">
                {cell.propValue}
              </code>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
