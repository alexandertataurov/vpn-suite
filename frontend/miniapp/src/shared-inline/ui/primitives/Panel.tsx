import type { ElementType, HTMLAttributes, ReactNode, Ref } from "react";
import { forwardRef } from "react";
import { cn } from "../../utils/cn";

export type PrimitivePanelVariant = "surface" | "outline";
export type PrimitivePanelPadding = "sm" | "md" | "lg";

export interface PrimitivePanelProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: PrimitivePanelVariant;
  padding?: PrimitivePanelPadding;
  children: ReactNode;
}

export const PrimitivePanel = forwardRef<HTMLElement, PrimitivePanelProps>(function PrimitivePanel(
  {
    as: Component = "div",
    variant = "surface",
    padding = "md",
    className = "",
    children,
    ...props
  },
  ref
) {
  return (
    <Component
      ref={ref as Ref<HTMLElement>}
      className={cn("ds-panel", className)}
      data-variant={variant}
      data-padding={padding}
      {...props}
    >
      {children}
    </Component>
  );
});
