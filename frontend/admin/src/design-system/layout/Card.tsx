import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export type CardVariant = "surface" | "outline" | "glass" | "raised";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  children: ReactNode;
  variant?: CardVariant;
  as?: ElementType;
}

const variantClass: Record<CardVariant, string> = {
  surface: "card",
  outline: "card card-panel",
  glass: "card card-glass",
  raised: "card card-raised",
};

export function Card({
  children,
  variant = "surface",
  as: Component = "div",
  className = "",
  ...props
}: CardProps) {
  return (
    <Component
      className={cn(variantClass[variant], className)}
      {...(props as HTMLAttributes<HTMLElement>)}
    >
      {children}
    </Component>
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
