export interface KeyboardRow {
  key: string;
  action: string;
}

export interface KeyboardTableProps {
  rows: KeyboardRow[];
  title?: string;
}

export function KeyboardTable({ rows, title = "Keyboard" }: KeyboardTableProps) {
  return (
    <section className="mb-10 overflow-x-auto rounded border border-[var(--color-border-subtle)]">
      <h2 className="mb-0 border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)] px-4 py-3 text-lg font-semibold text-[var(--color-text-primary)]">
        {title}
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)]">
            <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">Key</th>
            <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className="border-b border-[var(--color-border-faint)] last:border-0"
            >
              <td className="px-4 py-2">
                <kbd className="rounded border border-[var(--color-border-subtle)] bg-[var(--color-base)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-text-primary)]">
                  {row.key}
                </kbd>
              </td>
              <td className="px-4 py-2 text-[var(--color-text-secondary)]">{row.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
