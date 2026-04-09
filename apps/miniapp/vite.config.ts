import { defineConfig, type PluginOption } from "vitest/config";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { fileURLToPath } from "url";
import path from "path";
import { createManualChunks } from "./scripts/viteChunks";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enableSourcemap = process.env.VITE_SENTRY_SOURCEMAPS === "1";
const analyzeBundle = process.env.ANALYZE === "1";

export default defineConfig({
  optimizeDeps: {
    include: ["storybook/test"],
  },
  plugins: [
    react(),
    analyzeBundle
      ? (visualizer({
          filename: "dist/bundle-analysis.json",
          template: "raw-data",
          gzipSize: true,
          brotliSize: true,
        }) as PluginOption)
      : null,
  ].filter((plugin): plugin is PluginOption => plugin !== null),
  base: "/webapp/",
  resolve: {
    dedupe: ["react", "react-dom", "react-router-dom"],
    alias: {
      "@/design-system/patterns/FallbackScreen": path.resolve(
        __dirname,
        "./src/design-system/compositions/patterns/FallbackScreen.tsx",
      ),
      "@": path.resolve(__dirname, "./src"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@ds": path.resolve(__dirname, "./src/design-system/index.ts"),
      "@ds/core": path.resolve(__dirname, "./src/design-system/core/index.ts"),
      "@ds/components": path.resolve(__dirname, "./src/design-system/components/index.ts"),
      "@ds/compositions": path.resolve(__dirname, "./src/design-system/compositions/index.ts"),
      // Why: keep workspace package as source (no prebuild) for Vite dev/build.
      "@shared": path.resolve(__dirname, "../shared-web/src"),
      "@vpn-suite/shared": path.resolve(__dirname, "../shared-web/src"),
      "tailwind-merge": path.resolve(__dirname, "./src/utils/tailwindMergeLite.ts"),
    },
  },
  server: {
    port: 5175,
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: enableSourcemap,
    // Why: miniapp runs on mobile Telegram WebView; enforce stricter chunk warning threshold.
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks: createManualChunks("app"),
      },
    },
  },
});
