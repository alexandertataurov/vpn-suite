import { forwardRef, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Panel as PrimitivePanel } from "../primitives/Panel";

export interface TableContainerProps {
  children: ReactNode;
  /** Optional max height for vertical scroll; use tokenized value when possible. */
  maxHeight?: string | number;
  className?: string;
  "data-testid"?: string;
  /** For virtualization: forwarded to root div */
  style?: React.CSSProperties;
}

/**
 * Wrapper for all data tables: overflow-x, border, radius, surface.
 * Single source of truth for table container styling.
 */
export const TableContainer = forwardRef<HTMLElement, TableContainerProps>(function TableContainer(
  { children, maxHeight, className = "", "data-testid": dataTestId, style: styleProp },
  ref
) {
  const style =
    maxHeight != null
      ? { ...styleProp, maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight, overflow: "auto" as const }
      : styleProp;
  return (
    <PrimitivePanel
      ref={ref}
      className={cn("ds-table-wrap", className)}
      style={style}
      data-testid={dataTestId}
    >
      {children}
    </PrimitivePanel>
  );
});
