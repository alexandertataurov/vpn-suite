import type { ReactNode } from "react";
import { Check, X } from "lucide-react";

export interface UseCaseItem {
  title: string;
  description: string;
}

export interface UseCaseListProps {
  useCases: UseCaseItem[];
  antiPatterns?: UseCaseItem[];
}

export function UseCaseList({ useCases, antiPatterns = [] }: UseCaseListProps) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
        Use cases
      </h2>
      <ul className="mb-6 list-none space-y-3 pl-0">
        {useCases.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span
              className="mt-0.5 shrink-0 text-[var(--color-nominal-bright)]"
              aria-hidden
            >
              <Check className="h-4 w-4" />
            </span>
            <div>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {item.title}
              </span>
              <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {antiPatterns.length > 0 && (
        <>
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Anti-patterns
          </h3>
          <ul className="list-none space-y-3 pl-0">
            {antiPatterns.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="mt-0.5 shrink-0 text-[var(--color-critical-bright)]"
                  aria-hidden
                >
                  <X className="h-4 w-4" />
                </span>
                <div>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {item.title}
                  </span>
                  <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
