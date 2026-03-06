/**
 * Z-index values for JS (inline styles). Single source; must match --z-* in miniapp-tokens.css / miniapp.css.
 * Use CSS var() in stylesheets; use these constants for inline style.
 */
export const Z_DROPDOWN = 100;
export const Z_OVERLAY = 200;
export const Z_MODAL = 300;
export const Z_TOAST = 400;
export const Z_HEADER = 200;
export const Z_NAV = 200;
/** Above all UI (e.g. scanline overlay). CSS: --z-scanline */
export const Z_SCANLINE = 9999;
