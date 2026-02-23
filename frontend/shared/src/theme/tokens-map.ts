/**
 * Canonical token mapping — single source of truth for design system governance.
 * Use this for lint checks and documentation. Components MUST use semantic tokens only.
 *
 * @see docs/FOUNDATIONS_GOVERNANCE.md
 */

/** Primitive tokens — do NOT use directly in components. For composition only. */
export const PRIMITIVES = {
  color: {
    gray: ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"],
    primary: ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"],
    success: ["50", "100", "200", "300", "400", "500", "600"],
    warning: ["50", "100", "200", "300", "400", "500", "600"],
    error: ["50", "100", "200", "300", "400", "500", "600", "700"],
    ink: ["800", "900"],
  },
  spacing: ["0", "1", "2", "3", "4", "5", "6", "8", "10", "12", "16"],
  radius: ["0", "2", "4"],
  shadow: ["none", "sm"],
  zIndex: ["dropdown", "overlay", "modal", "toast"],
  duration: ["instant", "fast", "normal", "slow"],
  easing: ["linear", "in", "out", "in-out", "standard"],
} as const;

/** Semantic tokens — use these in components. Maps to primitives. */
export const SEMANTICS = {
  color: {
    bg: { token: "--color-bg", primitive: "gray-950/50", usage: "Page, chrome" },
    surface: { token: "--color-surface", primitive: "gray-900/200", usage: "Cards, raised surfaces" },
    "surface-2": { token: "--color-surface-2", primitive: "gray-800", usage: "Nested surfaces" },
    overlay: { token: "--color-overlay", usage: "Modals, dropdowns" },
    text: { token: "--color-text", primitive: "gray-50/900" },
    "text-muted": { token: "--color-text-muted", primitive: "gray-400/500" },
    "text-tertiary": { token: "--color-text-tertiary", usage: "Placeholder, disabled" },
    "text-inverse": { token: "--color-text-inverse", usage: "Text on dark" },
    border: { token: "--color-border" },
    "border-strong": { token: "--color-border-strong" },
    "border-subtle": { token: "--color-border-subtle" },
    accent: { token: "--color-accent" },
    "accent-hover": { token: "--color-accent-hover" },
    "accent-active": { token: "--color-accent-active" },
    "on-accent": { token: "--color-on-accent" },
    success: { token: "--color-success" },
    warning: { token: "--color-warning" },
    danger: { token: "--color-error", alias: "--color-danger-500" },
    info: { token: "--color-info" },
    "focus-ring": { token: "--color-focus-ring" },
  },
  spacing: {
    "component-padding": { token: "--spacing-component-padding", value: "4" },
    "component-padding-sm": { token: "--spacing-component-padding-sm", value: "2" },
    "component-padding-lg": { token: "--spacing-component-padding-lg", value: "6" },
    "section-gap": { token: "--spacing-section-gap", value: "16" },
  },
} as const;

/** Component → token mapping. Required for governance. */
export const COMPONENT_TOKENS = {
  Button: {
    primary: ["--color-accent", "--color-on-accent", "--radius-control", "--text-body"],
    secondary: ["--color-border", "--color-text", "--radius-control"],
  },
  Panel: ["--color-surface", "--color-border-subtle", "--radius-surface", "--shadow-sm"],
  Input: ["--color-surface", "--color-border", "--color-text", "--radius-control"],
  Table: ["--color-border-subtle", "--color-text", "--color-text-muted"],
} as const;

export type PrimitiveColorScale = keyof (typeof PRIMITIVES)["color"];
export type SemanticColorKey = keyof (typeof SEMANTICS)["color"];
