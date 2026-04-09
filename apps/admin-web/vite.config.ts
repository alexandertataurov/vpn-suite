import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enableSourcemap = process.env.VITE_SENTRY_SOURCEMAPS === "1";

export default defineConfig({
  plugins: [react()],
  base: "/admin/",
  resolve: {
    dedupe: ["react", "react-dom", "react-router-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Why: keep workspace package as source (no prebuild) for Vite dev/build.
      "@shared": path.resolve(__dirname, "../shared-web/src"),
      "@vpn-suite/shared": path.resolve(__dirname, "../shared-web/src"),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/health": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: enableSourcemap,
    // Why: keep chunk regressions visible in CI; admin can tolerate larger chunks than miniapp.
    chunkSizeWarningLimit: 250,
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
          if (id.includes("node_modules/@tanstack/react-query/") || id.includes("node_modules/@tanstack/react-virtual/")) {
            return "vendor-query";
          }
          if (id.includes("node_modules/react-hook-form/") || id.includes("node_modules/@hookform/resolvers/") || id.includes("node_modules/zod/")) {
            return "vendor-forms";
          }
          if (id.includes("node_modules/zustand/")) {
            return "vendor-zustand";
          }
          if (id.includes("node_modules/recharts/")) {
            return "vendor-recharts";
          }
          if (
            id.includes("node_modules/d3-") ||
            id.includes("node_modules/internmap/") ||
            id.includes("node_modules/delaunator/") ||
            id.includes("node_modules/robust-predicates/")
          ) {
            return "vendor-d3";
          }
          if (id.includes("node_modules/framer-motion/")) {
            return "vendor-motion";
          }
          if (id.includes("node_modules/lucide-react/")) {
            return "vendor-icons";
          }
        },
      },
    },
  },
});
