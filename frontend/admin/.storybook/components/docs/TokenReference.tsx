export type TokenCategory = "color" | "typography" | "spacing" | "shadow" | "motion";

export interface TokenReferenceRow {
  token: string;
  role: string;
  value: string;
  category?: TokenCategory;
  swatch?: string;
  barValue?: string;
  sampleText?: string;
}

export interface TokenReferenceProps {
  rows: TokenReferenceRow[];
  title?: string;
}

function ResolvedValue(props: { row: TokenReferenceRow }) {
  const { row } = props;
  if (row.swatch) {
    return (
      <span className="flex items-center gap-2">
        <span className="h-5 w-5 shrink-0 rounded border border-[var(--color-border-subtle)]" style={{ backgroundColor: row.swatch }} aria-hidden />
        <code className="text-xs text-[var(--color-text-muted)]">{row.value}</code>
      </span>
    );
  }
  if (row.barValue) {
    return (
      <span className="flex items-center gap-2">
        <span className="h-4 rounded-sm bg-[var(--color-accent)]" style={{ width: row.barValue }} aria-hidden />
        <code className="text-xs text-[var(--color-text-muted)]">{row.value}</code>
      </span>
    );
  }
  if (row.sampleText) {
    return <span className="text-sm text-[var(--color-text-primary)]" style={{ font: row.value }}>{row.sampleText}</span>;
  }
  return <code className="text-xs text-[var(--color-text-muted)]">{row.value}</code>;
}

const categoryOrder: TokenCategory[] = ["color", "typography", "spacing", "shadow", "motion"];

export function TokenReference(props: TokenReferenceProps) {
  const { rows, title = "Design tokens" } = props;
  const byCategory = rows.reduce<Record<TokenCategory, TokenReferenceRow[]>>((acc, row) => {
    const cat = row.category ?? "color";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(row);
    return acc;
  }, {} as Record<TokenCategory, TokenReferenceRow[]>);
  const categories = categoryOrder.filter((c) => byCategory[c]?.length);

  return (
    <section className="mb-10 overflow-x-auto rounded border border-[var(--color-border-subtle)]">
      <h2 className="mb-0 border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)] px-4 py-3 text-lg font-semibold text-[var(--color-text-primary)]">
        {title}
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)]">
            <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">Token</th>
            <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">Role</th>
            <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">Resolved value</th>
          </tr>
        </thead>
        <tbody>
          {categories.flatMap((cat) =>
            byCategory[cat].map((row) => (
              <tr key={row.token} className="border-b border-[var(--color-border-faint)] last:border-0">
                <td className="px-4 py-2 font-mono text-xs text-[var(--color-text-accent)]">{row.token}</td>
                <td className="px-4 py-2 text-[var(--color-text-secondary)]">{row.role}</td>
                <td className="px-4 py-2">
                  <ResolvedValue row={row} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
