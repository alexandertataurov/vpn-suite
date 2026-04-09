/**
 * Base URL for "Edit this page" links in docs (no trailing slash).
 * Set VITE_STORYBOOK_EDIT_URL at build time to point at your repo, e.g.:
 * https://github.com/owner/vpn-suite/edit/main
 */
export const DOCS_EDIT_BASE_URL: string =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: Record<string, string> }).env?.VITE_STORYBOOK_EDIT_URL) ||
  "https://github.com/your-org/vpn-suite/edit/main";

/** Default path under repo for design-system docs (used when meta.editPath is not set). */
export const DEFAULT_DOCS_EDIT_PATH = "frontend/admin/src/design-system/docs";
