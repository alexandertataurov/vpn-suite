import type { ReactNode } from "react";

export interface StepItem {
  title: string;
  description?: string;
  code?: string;
}

export interface StepsProps {
  items: StepItem[];
  children?: ReactNode;
}

export function Steps({ items }: StepsProps) {
  return (
    <div className="my-8">
      <div className="relative pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--color-border-subtle)]">
        {items.map((step, i) => (
          <div key={i} className="relative pb-8 last:pb-0">
            <div
              className="absolute left-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0EA5E9] bg-[var(--color-app-content)] text-xs font-semibold text-[#0EA5E9]"
              aria-hidden
            >
              {i + 1}
            </div>
            <div className="pt-0.5">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {step.title}
              </h4>
              {step.description && (
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {step.description}
                </p>
              )}
              {step.code && (
                <pre className="mt-3 overflow-x-auto rounded-lg border border-[var(--color-border-subtle)] bg-[#0A0A0A] px-4 py-3 text-xs font-mono text-[var(--color-text-primary)]">
                  <code>{step.code}</code>
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
