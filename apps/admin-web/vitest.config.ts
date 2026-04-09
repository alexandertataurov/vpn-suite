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
      "@shared": path.resolve(__dirname, "../shared-web/src"),
      "@vpn-suite/shared": path.resolve(__dirname, "../shared-web/src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**/*", "node_modules/**/*", "src/design-system/**/*"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
      },
      exclude: [
        "src/app/**",
        "src/**/*.types.ts",
        "src/design-system/**",
        "src/test/**",
        "e2e/**",
      ],
    },
  },
});
