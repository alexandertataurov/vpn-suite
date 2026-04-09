export interface ComponentTokenRow {
  token: string;
  role: string;
  value: string;
  swatch?: string;
}

export interface ComponentTokenTableProps {
  rows: ComponentTokenRow[];
  title?: string;
}

export function ComponentTokenTable({
  rows,
  title = "Design Tokens Used",
}: ComponentTokenTableProps) {
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
            <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.token} className="border-b border-[var(--color-border-faint)] last:border-0">
              <td className="px-4 py-2 font-mono text-xs text-[var(--color-text-accent)]">
                {row.token}
              </td>
              <td className="px-4 py-2 text-[var(--color-text-secondary)]">{row.role}</td>
              <td className="px-4 py-2">
                <span className="flex items-center gap-2">
                  {row.swatch && (
                    <span
                      className="h-5 w-5 shrink-0 rounded border border-[var(--color-border-subtle)]"
                      style={{ backgroundColor: row.swatch }}
                      aria-hidden
                    />
                  )}
                  <code className="text-xs text-[var(--color-text-muted)]">{row.value}</code>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
