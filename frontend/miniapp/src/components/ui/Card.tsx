import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  as?: "article" | "section" | "div";
}

export function Card({ children, as = "section", className = "", ...props }: CardProps) {
  const Component = as;
  return (
    <Component className={`ds-card ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ children, className = "", ...props }: CardHeaderProps) {
  return (
    <div className={`ds-card-header ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ children, className = "", ...props }: CardContentProps) {
  return (
    <div className={`ds-card-content ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ children, className = "", ...props }: CardFooterProps) {
  return (
    <div className={`ds-card-footer ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
