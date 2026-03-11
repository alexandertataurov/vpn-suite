import { defineConfig, defineProject, mergeConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { fileURLToPath } from "url";
import path from "path";
import viteConfig from "./vite.config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        defineProject({
          extends: true,
          test: {
            name: "unit",
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
              thresholds: { lines: 80 },
              exclude: ["src/design-system/**", "src/telegram/**", "src/test/**", "e2e/**"],
            },
          },
        }),
        defineProject({
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(__dirname, ".storybook"),
              // Use an ephemeral port to avoid collisions with `storybook` dev (6007).
              storybookScript: "npm exec -- storybook dev -p 0 --ci --no-open",
            }),
          ],
          test: {
            // Storybook runs Vitest with: --project storybook:<absolute-configDir>
            name: `storybook:${path.join(__dirname, ".storybook")}`,
            browser: {
              enabled: true,
              provider: playwright({}),
              headless: true,
              instances: [{ browser: "chromium" }],
            },
            setupFiles: ["./.storybook/vitest.setup.ts"],
          },
        }),
      ],
    },
  }),
);
