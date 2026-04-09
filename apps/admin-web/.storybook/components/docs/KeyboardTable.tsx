export interface KeyboardRow {
  key: string;
  action: string;
}

export interface KeyboardTableGroup {
  title: string;
  rows: KeyboardRow[];
}

export interface KeyboardTableProps {
  rows: KeyboardRow[];
  groups?: KeyboardTableGroup[];
  title?: string;
}

export function KeyboardTable({
  rows,
  groups,
  title = "Keyboard",
}: KeyboardTableProps) {
  const resolvedGroups: KeyboardTableGroup[] =
    groups && groups.length > 0 ? groups : [{ title, rows }];

  return (
    <section className="mb-10 overflow-x-auto rounded border border-[var(--color-border-subtle)]">
      {resolvedGroups.map((group, gi) => (
        <div key={gi}>
          <h2 className="mb-0 border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)] px-4 py-3 text-lg font-semibold text-[var(--color-text-primary)]">
            {group.title}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)]">
                <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">
                  Key
                </th>
                <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {group.rows.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-[var(--color-border-faint)] last:border-0"
                >
                  <td className="px-4 py-2">
                    <kbd className="rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-text-primary)]">
                      {row.key}
                    </kbd>
                  </td>
                  <td className="px-4 py-2 text-[var(--color-text-secondary)]">
                    {row.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}
