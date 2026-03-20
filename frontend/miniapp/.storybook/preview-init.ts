/**
 * Run before design-system CSS so base.css reduced-motion bypass applies.
 * Sets data-animations="force" so animations are visible in Storybook.
 */
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-animations", "force");
}
