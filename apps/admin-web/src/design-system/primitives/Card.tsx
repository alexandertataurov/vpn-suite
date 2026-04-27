import type { HTMLAttributes, ReactNode } from "react";

type CardVariant = "default" | "elevated" | "outlined" | "interactive";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
}

export function Card({ children, variant = "default", className = "", ...props }: CardProps) {
  const variantClass = variant !== "default" ? `card-${variant}` : null;
  return (
    <div className={["card", variantClass, className].filter(Boolean).join(" ").trim()} {...props}>
      {children}
    </div>
  );
}
