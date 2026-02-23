import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: "/admin/",
  resolve: {
    dedupe: ["react", "react-dom", "react-router-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@vpn-suite/shared": path.resolve(__dirname, "../shared/src"),
      "@vpn-suite/shared/theme": path.resolve(__dirname, "../shared/src/theme/index.ts"),
      "@vpn-suite/shared/ui": path.resolve(__dirname, "../shared/src/ui/index.ts"),
      "@vpn-suite/shared/api-client": path.resolve(__dirname, "../shared/src/api-client/index.ts"),
      "@vpn-suite/shared/types": path.resolve(__dirname, "../shared/src/types/index.ts"),
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
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/echarts") || id.includes("node_modules/echarts-for-react"))
            return "echarts";
          if (id.includes("node_modules")) return "vendor";
          if (id.includes("shared")) return "shared";
        },
      },
    },
  },
});
