export const telemetryKeys = {
  all: ["telemetry"] as const,
  snapshot: () => [...telemetryKeys.all, "snapshot"] as const,
  services: () => [...telemetryKeys.all, "services"] as const,
  dockerContainers: () => [...telemetryKeys.all, "docker", "containers"] as const,
  dockerAlerts: () => [...telemetryKeys.all, "docker", "alerts"] as const,
};
