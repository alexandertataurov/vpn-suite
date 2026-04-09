import type { ReactNode } from "react";

type CardVariant = "default" | "elevated" | "outlined" | "interactive";

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
}

export function Card({ children, variant = "default", className = "" }: CardProps) {
  const variantClass = variant !== "default" ? `card-${variant}` : null;
  return (
    <div className={["card", variantClass, className].filter(Boolean).join(" ").trim()}>
      {children}
    </div>
  );
}
