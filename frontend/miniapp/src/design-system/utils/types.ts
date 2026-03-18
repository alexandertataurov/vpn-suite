/**
 * Shared primitive types for design system components.
 * Single source of truth — components reference these instead of redefining.
 */

export type Size = "xs" | "sm" | "md" | "lg" | "xl" | "icon";

export type Intent =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "link"
  | "external";

export type Breakpoint = "sm" | "md" | "lg";

export type Responsive<T> = T | Partial<Record<Breakpoint, T>>;
