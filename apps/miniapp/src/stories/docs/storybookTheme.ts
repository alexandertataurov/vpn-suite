import { create } from "storybook/theming";

/* VPN Suite Miniapp — premium docs theme.
 * Accent: #3b7ef8 (from design tokens)
 * Fonts: Inter (UI), JetBrains Mono (code)
 */

const accent = "#3b7ef8";
const accentMuted = "rgba(59, 126, 248, 0.12)";

export const darkTheme = create({
  base: "dark",
  brandTitle: "VPN Suite Miniapp",
  brandUrl: "/",
  brandTarget: "_self",

  colorPrimary: accent,
  colorSecondary: accent,

  appBg: "#0f1117",
  appContentBg: "#0f1117",
  appPreviewBg: "#1a1d27",
  appBorderColor: "#252836",
  appBorderRadius: 10,

  fontBase: '"Inter Variable", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  fontCode: '"JetBrains Mono Variable", "SF Mono", ui-monospace, monospace',

  textColor: "#f0f2f8",
  textInverseColor: "#0f1117",

  barTextColor: "#8b90a4",
  barSelectedColor: accent,
  barHoverColor: "#f0f2f8",
  barBg: "#1a1d27",

  inputBg: "#252836",
  inputBorder: "#252836",
  inputTextColor: "#f0f2f8",
  inputBorderRadius: 10,

  buttonBg: "#252836",
  buttonBorder: "#252836",

  booleanBg: "#252836",
  booleanSelectedBg: accentMuted,
});

export const lightTheme = create({
  base: "light",
  brandTitle: "VPN Suite Miniapp",
  brandUrl: "/",
  brandTarget: "_self",

  colorPrimary: accent,
  colorSecondary: accent,

  appBg: "#fafafa",
  appContentBg: "#fafafa",
  appPreviewBg: "#f4f4f5",
  appBorderColor: "#e4e4e7",
  appBorderRadius: 10,

  fontBase: '"Inter Variable", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
  fontCode: '"JetBrains Mono Variable", "SF Mono", ui-monospace, monospace',

  textColor: "#0f1117",
  textInverseColor: "#fafafa",

  barTextColor: "#71717a",
  barSelectedColor: accent,
  barHoverColor: "#0f1117",
  barBg: "#f4f4f5",

  inputBg: "#ffffff",
  inputBorder: "#e4e4e7",
  inputTextColor: "#0f1117",
  inputBorderRadius: 10,

  buttonBg: "#f4f4f5",
  buttonBorder: "#e4e4e7",

  booleanBg: "#e4e4e7",
  booleanSelectedBg: accentMuted,
});

export const docsTheme = darkTheme;
export const docsThemeLight = lightTheme;
