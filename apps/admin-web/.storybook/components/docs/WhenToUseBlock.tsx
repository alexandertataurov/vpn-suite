export interface WhenToUseBlockProps {
  whenToUse?: string[];
  whenNotToUse?: string[];
}

export function WhenToUseBlock({
  whenToUse = [],
  whenNotToUse = [],
}: WhenToUseBlockProps) {
  if (whenToUse.length === 0 && whenNotToUse.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
        When to use
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {whenToUse.length > 0 && (
          <div className="rounded border-2 border-t-[var(--color-nominal)] border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
            <h3 className="border-b border-[var(--color-border-subtle)] bg-[var(--color-nominal-dim)] px-4 py-2 text-sm font-semibold text-[var(--color-nominal-bright)]">
              Use when
            </h3>
            <ul className="list-disc space-y-1 p-4 pl-6 text-sm text-[var(--color-text-secondary)]">
              {whenToUse.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {whenNotToUse.length > 0 && (
          <div className="rounded border-2 border-t-[var(--color-critical)] border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
            <h3 className="border-b border-[var(--color-border-subtle)] bg-[var(--color-critical-dim)] px-4 py-2 text-sm font-semibold text-[var(--color-critical-bright)]">
              Avoid when
            </h3>
            <ul className="list-disc space-y-1 p-4 pl-6 text-sm text-[var(--color-text-secondary)]">
              {whenNotToUse.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
