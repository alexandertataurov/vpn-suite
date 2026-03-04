import { useMemo, useState } from "react";

export type PropTypeKind =
  | "string"
  | "boolean"
  | "number"
  | "enum"
  | "function"
  | "ReactNode"
  | "unknown";

export interface PropRow {
  name: string;
  type: string;
  typeKind?: PropTypeKind;
  default?: string;
  required?: boolean;
  description?: string;
  deprecated?: boolean;
  migration?: string;
}

export interface PropsTableProps {
  rows: PropRow[];
}

const typeKindStyles: Record<PropTypeKind, string> = {
  string: "bg-[var(--color-accent-dim)] text-[var(--color-accent)]",
  boolean: "bg-[var(--color-nominal-dim)] text-[var(--color-nominal-bright)]",
  number: "bg-[var(--color-warning-dim)] text-[var(--color-warning-bright)]",
  enum: "bg-[var(--color-accent-dim)] text-[var(--color-accent)]",
  function: "bg-[var(--color-elevated)] text-[var(--color-text-muted)]",
  ReactNode: "bg-[var(--color-accent-dim)] text-[var(--color-accent)]",
  unknown: "bg-[var(--color-elevated)] text-[var(--color-text-muted)]",
};

type SortKey = "name" | "required";

export function PropsTable({ rows }: PropsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = a.name.localeCompare(b.name);
      } else {
        const ar = a.required ? 1 : 0;
        const br = b.required ? 1 : 0;
        cmp = ar - br;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <section className="mb-10 overflow-x-auto rounded border border-[var(--color-border-subtle)]">
      <h2 className="mb-0 border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)] px-4 py-3 text-lg font-semibold text-[var(--color-text-primary)]">
        Props
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-elevated)]">
            <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">
              <button
                type="button"
                onClick={() => toggleSort("name")}
                className="hover:text-[var(--color-text-accent)] transition-colors"
              >
                Name {sortKey === "name" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
            </th>
            <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">
              Type
            </th>
            <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">
              Default
            </th>
            <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">
              <button
                type="button"
                onClick={() => toggleSort("required")}
                className="hover:text-[var(--color-text-accent)] transition-colors"
              >
                Required {sortKey === "required" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
            </th>
            <th className="px-4 py-2 text-left font-medium text-[var(--color-text-primary)]">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr
              key={row.name}
              className={`border-b border-[var(--color-border-faint)] last:border-0 ${row.deprecated ? "opacity-60" : ""}`}
            >
              <td className="px-4 py-2">
                <span className="flex items-center gap-1">
                  {row.required && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-critical-bright)]"
                      title="Required"
                      aria-hidden
                    />
                  )}
                  <code
                    className={`font-mono text-xs ${row.deprecated ? "line-through text-[var(--color-text-muted)]" : "text-[var(--color-text-accent)]"}`}
                  >
                    {row.name}
                  </code>
                </span>
                {row.deprecated && row.migration && (
                  <p className="mt-1 text-xs text-[var(--color-warning-bright)]">
                    {row.migration}
                  </p>
                )}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`inline-block rounded px-1.5 py-0.5 font-mono text-xs ${typeKindStyles[row.typeKind ?? "unknown"]}`}
                >
                  {row.type}
                </span>
              </td>
              <td className="px-4 py-2 font-mono text-xs text-[var(--color-text-muted)]">
                {row.default ?? "—"}
              </td>
              <td className="px-4 py-2 text-[var(--color-text-muted)]">
                {row.required ? "Yes" : "No"}
              </td>
              <td className="px-4 py-2 text-[var(--color-text-secondary)]">
                {row.description ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
