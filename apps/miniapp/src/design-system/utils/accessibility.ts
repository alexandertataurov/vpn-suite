/**
 * Design-system accessibility helpers (aria, roles). Use for consistent a11y in components.
 */

/** Props for an element that can be described by a label (e.g. icon-only button). */
export function getAriaLabelProps(label: string | undefined): { "aria-label"?: string } {
  return label ? { "aria-label": label } : {};
}
