type ChunkNamer = (id: string) => string | undefined;

function withPrefix(prefix: string, name: string): string {
  return prefix === "app" ? name : `${prefix}-${name}`;
}

export function createManualChunks(prefix: string): ChunkNamer {
  return (id: string) => {
    if (id.includes("/shared-web/src/") || id.includes("/shared/src/")) {
      return withPrefix(prefix, "shared");
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
