import { defineConfig, type PluginOption } from "vitest/config";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enableSourcemap = process.env.VITE_SENTRY_SOURCEMAPS === "1";
const analyzeBundle = process.env.ANALYZE === "1";

export default defineConfig({
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
      "@": path.resolve(__dirname, "./src"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      // Why: keep workspace package as source (no prebuild) for Vite dev/build.
      "@shared": path.resolve(__dirname, "../shared/src"),
      "@vpn-suite/shared": path.resolve(__dirname, "../shared/src"),
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
    chunkSizeWarningLimit: 150,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("/shared/src/")) return "shared";
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/") ||
            id.includes("node_modules/use-sync-external-store/")
          ) {
            return "vendor-react";
          }
          if (id.includes("node_modules/react-router-dom/") || id.includes("node_modules/@remix-run/router/")) {
            return "vendor-router";
          }
          if (id.includes("node_modules/@tanstack/react-query/")) {
            return "vendor-query";
          }
          if (id.includes("node_modules/lucide-react/")) {
            return "vendor-icons";
          }
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-ui";
          }
        },
      },
    },
  },
});
