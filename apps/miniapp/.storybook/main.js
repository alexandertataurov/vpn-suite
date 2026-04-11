const path = require("path");
const { globSync } = require("node:fs");

const appRoot = path.join(__dirname, "..");
/** Canonical page contracts live in `src/stories/pages/` only. These paths duplicate the same story IDs. */
const EXCLUDED_STORY_PATH_MARKERS = [
  "src/stories/design-system/stories/pages/",
  "src/design-system/stories/pages/",
];

function isExcludedDuplicateStoryPath(posixPath) {
  return EXCLUDED_STORY_PATH_MARKERS.some((m) => posixPath.includes(m));
}

function getStoryFileEntries() {
  const relFiles = globSync("src/**/*.stories.@(js|jsx|mjs|ts|tsx)", {
    cwd: appRoot,
    exclude: (p) => isExcludedDuplicateStoryPath(p.split(path.sep).join("/")),
  });
  return relFiles.map((rel) =>
    path.posix.join("..", rel.split(path.sep).join("/")),
  );
}

/** @type {import('@storybook/react-vite').StorybookConfig} */
const config = {
  // CSF entries first (explicit list excludes duplicate page trees), then MDX.
  stories: [...getStoryFileEntries(), "../src/**/*.mdx"],
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
    build: {
      ...viteConfig.build,
      // Storybook's preview iframe aggregates the full catalog, so its bundle is
      // substantially larger than the production miniapp build. Keep the stricter
      // threshold in vite.config.ts for the app, and relax it only for Storybook.
      chunkSizeWarningLimit: 2500,
    },
  }),
};

module.exports = config;
