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
      "@vpn-suite/shared": path.resolve(__dirname, "./src/shared"),
      "@vpn-suite/shared/theme": path.resolve(__dirname, "./src/shared/theme/index.ts"),
      "@vpn-suite/shared/api-client": path.resolve(__dirname, "./src/shared/api-client/index.ts"),
      "@vpn-suite/shared/types": path.resolve(__dirname, "./src/shared/types/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**/*", "node_modules/**/*"],
  },
});
