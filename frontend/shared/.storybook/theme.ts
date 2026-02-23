import { create } from "@storybook/theming/create";

/**
 * VPN Suite Design System Storybook theme.
 * Values aligned with system surfaces + accent.
 */
export const storybookTheme = create({
  base: "dark",
  brandTitle: "VPN Suite Design System",
  brandUrl: "/",
  colorPrimary: "#5469d4",
  colorSecondary: "#5469d4",
  appBg: "#0b0f16",
  appContentBg: "#111827",
  barBg: "#0e141f",
  textColor: "#e6edf3",
  textInverseColor: "#0b0f16",
});

/** Preview background values */
export const backgroundValues = [
  { name: "surface", value: "#090d13" },
  { name: "elevated", value: "#111827" },
  { name: "dark", value: "#1f2937" },
  { name: "light", value: "#ffffff" },
];
