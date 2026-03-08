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
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 70,
      },
      exclude: ["src/design-system/**", "src/telegram/**", "src/test/**", "e2e/**"],
    },
  },
});
