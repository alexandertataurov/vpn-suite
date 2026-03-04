import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  title?: string;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  className?: string;
  getRowClassName?: (row: T) => string | undefined;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  getRowKey,
  className = "",
  getRowClassName,
}: DataTableProps<T>) {
  return (
    <table className={`data-table ${className}`.trim()}>
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
