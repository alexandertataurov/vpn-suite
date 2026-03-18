import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-links",
    // "./addons/design-tokens/register.tsx", // TODO: migrate to Storybook 10 addon API
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  async viteFinal(config) {
    config.base = "/";
    config.resolve = config.resolve ?? {};
    const stubPath = `${process.cwd()}/.storybook/stubs/LiveMetricsProvider.tsx`;
    const aliasEntry = { find: "@/context/LiveMetricsProvider", replacement: stubPath };
    const existingAlias = config.resolve.alias;
    const existingArray = Array.isArray(existingAlias)
      ? existingAlias
      : existingAlias && typeof existingAlias === "object"
        ? Object.entries(existingAlias).map(([find, replacement]) => ({ find, replacement: replacement as string }))
        : [];
    config.resolve.alias = [aliasEntry, ...existingArray];
    return config;
  },
};

export default config;
