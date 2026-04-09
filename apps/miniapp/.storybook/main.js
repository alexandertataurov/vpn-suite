/** @type {import('@storybook/react-vite').StorybookConfig} */
const config = {
  stories: [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/**/*.mdx",
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-links",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@chromatic-com/storybook",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    plugins: [
      {
        name: "fix-mdx-file-urls",
        enforce: "pre",
        resolveId(source) {
          if (source.startsWith("file://") && source.includes("mdx-react-shim")) {
            return new URL(source).pathname;
          }
          return null;
        },
      },
      ...(viteConfig.plugins ?? []),
    ],
    optimizeDeps: {
      ...viteConfig.optimizeDeps,
      include: [...(viteConfig.optimizeDeps?.include ?? []), "storybook/test"],
    },
  }),
};

module.exports = config;
