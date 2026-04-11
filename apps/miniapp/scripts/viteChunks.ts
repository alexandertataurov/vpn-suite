type ChunkNamer = (id: string) => string | undefined;

function withPrefix(prefix: string, name: string): string {
  return prefix === "app" ? name : `${prefix}-${name}`;
}

export function createManualChunks(prefix: string): ChunkNamer {
  return (id: string) => {
    if (
      id.includes("node_modules/@storybook/") ||
      id.includes("node_modules/storybook/") ||
      id.includes("node_modules/@mdx-js/") ||
      id.includes("node_modules/mdast-") ||
      id.includes("node_modules/micromark") ||
      id.includes("node_modules/hast-") ||
      id.includes("node_modules/unist-")
    ) {
      return withPrefix(prefix, "vendor-storybook");
    }
    if (
      id.includes("node_modules/axe-core/") ||
      id.includes("node_modules/@storybook/addon-a11y/")
    ) {
      return withPrefix(prefix, "vendor-a11y");
    }
    if (id.includes("/shared-web/src/") || id.includes("/shared/src/")) {
      return withPrefix(prefix, "shared");
    }
    if (id.includes("/src/storybook/") || id.includes("/.storybook/")) {
      return withPrefix(prefix, "storybook-runtime");
    }
    if (id.includes("/src/stories/foundations/")) {
      return withPrefix(prefix, "foundations");
    }
    if (id.includes("/src/stories/design-system/") || id.includes("/src/stories/pages/")) {
      return withPrefix(prefix, "design-system-stories");
    }
    if (id.includes("/src/design-system/components/")) {
      return withPrefix(prefix, "design-system-components");
    }
    if (id.includes("/src/design-system/compositions/patterns/")) {
      return withPrefix(prefix, "design-system-patterns");
    }
    if (id.includes("/src/design-system/compositions/recipes/")) {
      return withPrefix(prefix, "design-system-recipes");
    }
    if (id.includes("/src/design-system/core/") || id.includes("/src/design-system/hooks/")) {
      return withPrefix(prefix, "design-system-core");
    }
    if (id.includes("/src/pages/")) {
      return withPrefix(prefix, "app-pages");
    }
    if (id.includes("/src/page-models/")) {
      return withPrefix(prefix, "app-models");
    }
    if (id.includes("/src/api/") || id.includes("/src/hooks/")) {
      return withPrefix(prefix, "app-services");
    }
    if (
      id.includes("node_modules/react/") ||
      id.includes("node_modules/react-dom/") ||
      id.includes("node_modules/scheduler/") ||
      id.includes("node_modules/use-sync-external-store/")
    ) {
      return withPrefix(prefix, "vendor-react");
    }
    if (id.includes("node_modules/react-router-dom/") || id.includes("node_modules/@remix-run/router/")) {
      return withPrefix(prefix, "vendor-router");
    }
    if (id.includes("node_modules/@tanstack/react-query/")) {
      return withPrefix(prefix, "vendor-query");
    }
    if (id.includes("node_modules/@sentry/")) {
      return withPrefix(prefix, "vendor-sentry");
    }
    if (id.includes("node_modules/lucide-react/")) {
      return withPrefix(prefix, "vendor-icons");
    }
  };
}
