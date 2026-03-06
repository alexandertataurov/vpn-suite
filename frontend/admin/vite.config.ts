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
      "@shared": path.resolve(__dirname, "../shared/src"),
      "@vpn-suite/shared": path.resolve(__dirname, "../shared/src"),
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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/echarts") || id.includes("node_modules/echarts-for-react"))
            return "echarts";
          if (id.includes("node_modules")) return "vendor";
          if (id.includes("/shared/src/")) return "shared";
        },
      },
    },
  },
});
