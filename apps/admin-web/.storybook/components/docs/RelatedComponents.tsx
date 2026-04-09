import { ChevronRight } from "lucide-react";
import { PrimitiveBadge } from "../../design-system-compat";

export type RelatedStatus = "stable" | "beta" | "deprecated";

export interface RelatedComponentItem {
  name: string;
  description: string;
  href: string;
  status?: RelatedStatus;
}

export interface RelatedComponentsProps {
  items: RelatedComponentItem[];
  title?: string;
}

export function RelatedComponents({ items, title = "Related components" }: RelatedComponentsProps) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="flex items-start gap-2 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent-border)] hover:bg-[var(--color-elevated)]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--color-text-accent)]">
                  {item.name}
                </span>
                {item.status != null && (
                  <PrimitiveBadge
                    variant={item.status === "stable" ? "nominal" : item.status === "beta" ? "warning" : "critical"}
                    size="sm"
                  >
                    {item.status}
                  </PrimitiveBadge>
                )}
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{item.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden />
          </a>
        ))}
      </div>
    </section>
  );
}
