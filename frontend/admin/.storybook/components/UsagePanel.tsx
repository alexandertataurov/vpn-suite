import type { ReactNode } from "react";

export interface DoDonItem {
  label: string;
  node: ReactNode;
  explanation?: string;
}

export interface UsagePanelProps {
  doItems: DoDonItem[];
  dontItems: DoDonItem[];
}

export function UsagePanel({ doItems, dontItems }: UsagePanelProps) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
        Usage Guidelines
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded border-2 border-t-[var(--color-nominal)] border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
          <h3 className="border-b border-[var(--color-border-subtle)] bg-[var(--color-nominal-dim)] px-4 py-2 text-sm font-semibold text-[var(--color-nominal-bright)]">
            Do
          </h3>
          <div className="divide-y divide-[var(--color-border-faint)] p-4">
            {doItems.map((item, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0">
                <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">{item.label}</p>
                <div className="mb-1">{item.node}</div>
                {item.explanation && (
                  <p className="text-xs text-[var(--color-text-secondary)]">{item.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded border-2 border-t-[var(--color-critical)] border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
          <h3 className="border-b border-[var(--color-border-subtle)] bg-[var(--color-critical-dim)] px-4 py-2 text-sm font-semibold text-[var(--color-critical-bright)]">
            Don&apos;t
          </h3>
          <div className="divide-y divide-[var(--color-border-faint)] p-4">
            {dontItems.map((item, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0">
                <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">{item.label}</p>
                <div className="mb-1">{item.node}</div>
                {item.explanation && (
                  <p className="text-xs text-[var(--color-text-secondary)]">{item.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
