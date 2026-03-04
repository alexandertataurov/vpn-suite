type Row = { token: string; value: string; usage?: string };

type TokenTableProps = {
  rows: Row[];
};

export function TokenTable({ rows }: TokenTableProps) {
  return (
    <div className="my-4 overflow-x-auto rounded border border-[var(--color-border-subtle)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)]">
            <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">Token</th>
            <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">Value</th>
            {rows.some((r) => r.usage) && (
              <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">Usage</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.token} className="border-b border-[var(--color-border-faint)] last:border-0">
              <td className="px-4 py-2 font-mono text-xs text-[var(--color-text-accent)]">{row.token}</td>
              <td className="px-4 py-2 text-[var(--color-text-secondary)]">{row.value}</td>
              {rows.some((r) => r.usage) && (
                <td className="px-4 py-2 text-[var(--color-text-muted)]">{row.usage ?? "—"}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
