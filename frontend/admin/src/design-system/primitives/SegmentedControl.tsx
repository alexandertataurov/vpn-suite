import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * Aerospace design system: mutually exclusive options (replaces radio groups).
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = "",
  ariaLabel = "Select option",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("segmented-control", className)}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={opt.value === value}
          className={cn("segmented-control__option", opt.value === value && "segmented-control__option--active")}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
