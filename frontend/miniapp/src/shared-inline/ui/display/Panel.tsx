import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Panel as PrimitivePanel, type PrimitivePanelVariant } from "../primitives/Panel";

export type PanelVariant = "surface" | "outline" | "glass" | "raised";

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  children: ReactNode;
  variant?: PanelVariant;
  as?: ElementType;
}

const variantClass: Record<PanelVariant, string> = {
  surface: "card",
  outline: "card card-panel",
  glass: "card card-glass",
  raised: "card card-raised",
};

const toPrimitiveVariant = (variant: PanelVariant): PrimitivePanelVariant =>
  variant === "outline" ? "outline" : "surface";

export function Panel({
  children,
  variant = "surface",
  as: Component = "div",
  className = "",
  ...props
}: PanelProps) {
  return (
    <PrimitivePanel
      as={Component as ElementType}
      className={cn(variantClass[variant], className)}
      variant={toPrimitiveVariant(variant)}
      {...(props as HTMLAttributes<HTMLElement>)}
    >
      {children}
    </PrimitivePanel>
  );
}

export interface PanelHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  actions?: ReactNode;
}

export function PanelHeader({ title, actions, className = "", ...props }: PanelHeaderProps) {
  return (
    <div className={cn("card-header", className)} {...props}>
      <div className="card-header-title">{title}</div>
      {actions != null ? <div className="card-header-actions">{actions}</div> : null}
    </div>
  );
}

export interface PanelBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function PanelBody({ children, className = "", ...props }: PanelBodyProps) {
  return (
    <div className={cn("card-content", className)} {...props}>
      {children}
    </div>
  );
}
