import { cn } from "@vpn-suite/shared";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  label?: string;
  className?: string;
}

export function Divider({
  orientation = "horizontal",
  label,
  className,
}: DividerProps) {
  if (label != null) {
    return (
      <div
        className={cn(
          "ds-divider",
          `ds-divider--${orientation}`,
          "ds-divider--with-label",
          className
        )}
      >
        <span className="ds-divider__label">{label}</span>
        <span className="ds-divider__line" />
      </div>
    );
  }
  return (
    <hr
      className={cn("ds-divider", `ds-divider--${orientation}`, className)}
      aria-orientation={orientation}
    />
  );
}
