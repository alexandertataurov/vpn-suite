import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@shared": path.resolve(__dirname, "../shared/src"),
      "@vpn-suite/shared": path.resolve(__dirname, "../shared/src"),
      "tailwind-merge": path.resolve(__dirname, "./src/utils/tailwindMergeLite.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**/*", "src/design-system/**/*"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: [
        "src/api/client.ts",
        "src/api/endpoints/auth.ts",
        "src/api/endpoints/me.ts",
        "src/api/endpoints/plans.ts",
        "src/bootstrap/authBootstrap.ts",
        "src/bootstrap/referralCapture.ts",
        "src/hooks/useOnlineStatus.ts",
        "src/hooks/useReferralAttach.tsx",
        "src/hooks/useSession.ts",
        "src/hooks/useTelegramHaptics.ts",
        "src/hooks/useTelemetry.ts",
        "src/hooks/useTrackScreen.ts",
        "src/lib/api-client/create-client.ts",
        "src/lib/api-client/get-base-url.ts",
        "src/lib/query-keys/webapp.query-keys.ts",
        "src/page-models/helpers.ts",
        "src/page-models/useConnectStatusPageModel.ts",
        "src/page-models/useRestoreAccessPageModel.ts",
        "src/page-models/useServerSelectionPageModel.ts",
        "src/page-models/useSupportPageModel.ts",
        "src/page-models/upsell/evaluateUpsell.ts",
        "src/page-models/upsell/shouldSuppressUpsell.ts",
        "src/telemetry/webappTelemetry.ts",
        "src/utils/tailwindMergeLite.ts",
      ],
      thresholds: {
        lines: 80,
      },
      exclude: ["src/design-system/**", "src/telegram/**", "src/test/**", "e2e/**"],
    },
  },
});
