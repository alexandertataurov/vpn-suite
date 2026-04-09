import type { ReactNode } from "react";

export interface UsagePanelItem {
  type: "do" | "dont";
  label: string;
  children: ReactNode;
  explanation?: string;
}

export interface UsagePanelProps {
  items: UsagePanelItem[];
}

/** Legacy shape for backwards compatibility */
export interface DoDonItem {
  label: string;
  node: ReactNode;
  explanation?: string;
}

export interface UsagePanelLegacyProps {
  doItems: DoDonItem[];
  dontItems: DoDonItem[];
}

function normalizeItems(
  props: UsagePanelProps | UsagePanelLegacyProps
): UsagePanelItem[] {
  if ("items" in props) return props.items;
  const items: UsagePanelItem[] = [];
  props.doItems.forEach((d) =>
    items.push({ type: "do", label: d.label, children: d.node, explanation: d.explanation })
  );
  props.dontItems.forEach((d) =>
    items.push({ type: "dont", label: d.label, children: d.node, explanation: d.explanation })
  );
  return items;
}

export function UsagePanel(props: UsagePanelProps | UsagePanelLegacyProps) {
  const items = normalizeItems(props);
  const doItems = items.filter((i) => i.type === "do");
  const dontItems = items.filter((i) => i.type === "dont");

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
                <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">
                  {item.label}
                </p>
                <div className="mb-1">{item.children}</div>
                {item.explanation && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {item.explanation}
                  </p>
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
                <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">
                  {item.label}
                </p>
                <div className="mb-1">{item.children}</div>
                {item.explanation && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {item.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
