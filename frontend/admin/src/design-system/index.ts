export * from "./primitives";
export * from "./layout";
export * from "./data-display";
export * from "./feedback";
export * from "./navigation";
export * from "./typography";
export {
  Badge as PrimitiveBadge,
  type BadgeProps as PrimitiveBadgeProps,
  type BadgeVariant as PrimitiveBadgeVariant,
  type BadgeSize as PrimitiveBadgeSize,
} from "./primitives/Badge";
export {
  TableRow as PrimitiveTableRow,
  type PrimitiveTableRowProps,
} from "./primitives/TableRow";
export {
  TableCell as PrimitiveTableCell,
  type PrimitiveTableCellProps,
  type PrimitiveTableCellAlign,
} from "./primitives/TableCell";
export { MetricCell, type MetricCellProps } from "./primitives/MetricCell";
export { Divider as PrimitiveDivider, type DividerProps as PrimitiveDividerProps } from "./primitives/Divider";
export { Stack as PrimitiveStack, type StackProps as PrimitiveStackProps } from "./layout/Stack";
export {
  Table,
  Pagination as TablePagination,
  VirtualTable,
  TableContainer,
  TableSkeleton,
  TableSortHeader,
  EmptyTableState,
  CellText,
  CellNumber,
  CellActions,
  CellCompound,
  CellAvatar,
  CellPrimary,
  CellMuted,
  CellSecondary,
} from "./table";
export type {
  TableSelection,
  Column,
  VirtualTableProps,
  TableContainerProps,
  TableSkeletonProps,
  TableSortHeaderProps,
} from "./table";
export * from "./icons";
export type { LucideIcon } from "./icons";
export { STATUS_TOKENS } from "./status";
export type { StatusVariant } from "./status";

// Legacy/shared-inline exports used by the app (keep public API stable)
export { FormStack } from "./layout/FormStack";
export type { FormStackProps } from "./layout/FormStack";
export { FormActions } from "./navigation/FormActions";
export { InlineError } from "./layout/InlineError";
export { InlineAlert as Alert } from "./feedback/InlineAlert";
export { Skeleton as LoadingSkeleton } from "./primitives/Skeleton";
