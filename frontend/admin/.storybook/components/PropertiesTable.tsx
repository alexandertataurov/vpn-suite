import type { PropRow, PropTypeKind } from "./docs/PropsTable";
import { PropsTable } from "./docs/PropsTable";

export type { PropRow, PropTypeKind };

export interface PropertiesTableProps {
  rows: PropRow[];
}

/**
 * Styled props table: Prop / Type / Default / Description.
 * Type as colored badge; required prop indicator dot.
 * Alias of PropsTable for MDX usage.
 */
export function PropertiesTable({ rows }: PropertiesTableProps) {
  return <PropsTable rows={rows} />;
}
