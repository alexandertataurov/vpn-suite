import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  title?: string;
}

type DataTableDensity = "default" | "compact";

interface DataTableProps<T extends Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  density?: DataTableDensity;
  className?: string;
  getRowClassName?: (row: T) => string | undefined;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  getRowKey,
  density = "default",
  className = "",
  getRowClassName,
}: DataTableProps<T>) {
  const densityClass = density === "compact" ? "data-table-compact" : null;
  return (
    <table className={["data-table", densityClass, className].filter(Boolean).join(" ").trim()}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)} title={col.title}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={getRowKey(row)} className={getRowClassName ? getRowClassName(row) || "" : ""}>
            {columns.map((col) => (
              <td key={String(col.key)}>
                {(row[col.key as keyof T] as ReactNode) ?? "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
