/**
 * Startup manifest: layers, phases, and ownership.
 * Use when adding new startup steps or debugging initialization order.
 *
 * Layer 0 — Telemetry (main.tsx)
 * - bootstrapTelemetry() runs before React mount
 * - initAnalytics, wireGlobalErrors, initWebVitals, initSentry
 * - Owner: main.tsx
 *
 * Layer 1 — Platform (AppRoot)
 * - initTelegramRuntime: ready(), expand(), requestFullscreen(), disableVerticalSwipes()
 * - Runs on first paint (useEffect + requestAnimationFrame)
 * - Owner: AppRoot
 *
 * Layer 2 — Bootstrap (BootstrapController)
 * - useBootstrapMachine: initData → auth → session → splash → onboarding/app_ready
 * - Gates Routes; app mounts only when phase === app_ready
 * - Owner: BootstrapController
 */

export const STARTUP_LAYERS = {
  /** Telemetry, global errors, web vitals. Runs before React mount. */
  LAYER_0_TELEMETRY: "main.tsx",
  /** Telegram ready/expand/fullscreen. Runs after first paint. */
  LAYER_1_PLATFORM: "AppRoot",
  /** Auth, session, onboarding. Gates Routes. */
  LAYER_2_BOOTSTRAP: "BootstrapController",
} as const;
