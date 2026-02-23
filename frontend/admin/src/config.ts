/**
 * Admin app config. Single source for deploy path.
 * Use VITE_ADMIN_BASE in .env to override (e.g. /admin, /panel).
 */
export const ADMIN_BASE =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: { VITE_ADMIN_BASE?: string } }).env?.VITE_ADMIN_BASE) ||
  "/admin";
