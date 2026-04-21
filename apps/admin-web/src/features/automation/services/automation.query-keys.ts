export const automationKeys = {
  all: ["automation"] as const,
  status: () => [...automationKeys.all, "status"] as const,
  runs: () => [...automationKeys.all, "runs"] as const,
};

export const clusterKeys = {
  all: ["cluster"] as const,
  health: () => [...clusterKeys.all, "health"] as const,
  topology: () => [...clusterKeys.all, "topology"] as const,
  nodes: () => [...clusterKeys.all, "nodes"] as const,
};
