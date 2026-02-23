import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../src/docs/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)",
    "../../admin/src/**/*.stories.@(js|jsx|ts|tsx)",
    "../../miniapp/src/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-links",
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions",
  ],
  framework: "@storybook/react-vite",
  async viteFinal(config) {
    const { resolve } = await import("node:path");
    const root = resolve(process.cwd());
    return {
      ...config,
      base: process.env.NODE_ENV === "production" ? "/storybook/" : "./",
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          "@": resolve(root, "..", "admin", "src"),
          "@vpn-suite/shared": resolve(root, "src"),
          "@vpn-suite/shared/ui": resolve(root, "src", "ui", "index.ts"),
          "@vpn-suite/shared/theme": resolve(root, "src", "theme", "index.ts"),
          "@vpn-suite/shared/api-client": resolve(root, "src", "api-client", "index.ts"),
          "@vpn-suite/shared/types": resolve(root, "src", "types", "index.ts"),
        },
      },
    };
  },
};

export default config;
