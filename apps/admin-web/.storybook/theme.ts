import { create } from "storybook/theming";

/* VPN Suite design system — premium editorial theme
 * Accent: #0EA5E9 (sky)
 * Fonts: Inter (UI), Fraunces (headings), JetBrains Mono (code)
 * No pure black/white — near-black #0A0A0A, off-white #FAFAFA
 */

const accent = "#0EA5E9";
const accentHover = "#38BDF8";
const accentMuted = "rgba(14, 165, 233, 0.12)";
const accentSelection = "rgba(14, 165, 233, 0.35)";

export const darkTheme = create({
  base: "dark",
  brandTitle: "VPN Suite",
  brandUrl: "/",
  brandTarget: "_self",
  // brandImage: "/vpn-suite-wordmark.svg", // optional: add wordmark URL

  colorPrimary: accent,
  colorSecondary: accent,

  appBg: "#0A0A0A",
  appContentBg: "#0A0A0A",
  appPreviewBg: "#0F0F0F",
  appBorderColor: "#1F1F1F",
  appBorderRadius: 8,

  fontBase: '"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  fontCode: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',

  textColor: "#EDF2F8",
  textInverseColor: "#0A0A0A",

  barTextColor: "#71717A",
  barSelectedColor: accent,
  barHoverColor: "#EDF2F8",
  barBg: "#0F0F0F",

  inputBg: "#18181B",
  inputBorder: "#27272A",
  inputTextColor: "#EDF2F8",
  inputBorderRadius: 6,

  buttonBg: "#18181B",
  buttonBorder: "#27272A",

  booleanBg: "#27272A",
  booleanSelectedBg: accentMuted,
});

export const lightTheme = create({
  base: "light",
  brandTitle: "VPN Suite",
  brandUrl: "/",
  brandTarget: "_self",

  colorPrimary: accent,
  colorSecondary: accent,

  appBg: "#FAFAFA",
  appContentBg: "#FAFAFA",
  appPreviewBg: "#F4F4F5",
  appBorderColor: "#E4E4E7",
  appBorderRadius: 8,

  fontBase: '"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  fontCode: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',

  textColor: "#0A0A0A",
  textInverseColor: "#FAFAFA",

  barTextColor: "#71717A",
  barSelectedColor: accent,
  barHoverColor: "#0A0A0A",
  barBg: "#F4F4F5",

  inputBg: "#FFFFFF",
  inputBorder: "#E4E4E7",
  inputTextColor: "#0A0A0A",
  inputBorderRadius: 6,

  buttonBg: "#F4F4F5",
  buttonBorder: "#E4E4E7",

  booleanBg: "#E4E4E7",
  booleanSelectedBg: accentMuted,
});

/** Default docs theme (dark). Toggle in toolbar uses themes.dark / themes.light or custom. */
export const docsTheme = darkTheme;
export const docsThemeLight = lightTheme;

/** For manager + docs theme toggle */
export { accent, accentHover, accentMuted, accentSelection };
