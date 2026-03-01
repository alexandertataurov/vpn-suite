import { Skeleton } from "@/design-system";

export interface TableSkeletonProps {
  /** Number of skeleton rows */
  rows?: number;
  /** Number of columns (each gets equal width) */
  columns?: number;
  /** Row density: compact = 40px, comfortable = 48px */
  density?: "compact" | "comfortable";
  className?: string;
  "data-testid"?: string;
}

/**
 * Skeleton loader for table layout. Renders placeholder rows.
 */
export function TableSkeleton({
  rows = 4,
  columns = 5,
  density = "comfortable",
  className = "",
  "data-testid": dataTestId,
}: TableSkeletonProps) {
  const densityClass = density === "compact" ? "ds-table-density-compact" : "";
  return (
    <div
      className={`ds-table-wrap data-table-skeleton ${densityClass} ${className}`.trim()}
      data-testid={dataTestId}
    >
      <table className="ds-table">
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, i) => (
              <th key={i}>
                <Skeleton height={14} width={`${60 + (i % 3) * 20}%`} variant="shimmer" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }, (_, colIndex) => (
                <td key={colIndex}>
                  <Skeleton height={16} width={`${40 + (rowIndex + colIndex) % 5 * 15}%`} variant="shimmer" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
