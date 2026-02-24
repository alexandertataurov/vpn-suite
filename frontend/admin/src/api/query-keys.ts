/** Canonical query keys for React Query. Unifying keys enables cache deduplication. */
export const SERVERS_LIST_KEY = ["servers", "list"] as const;

/** Full server list (200) for region dropdown / telemetry; distinct from paginated list. */
export const SERVERS_LIST_FULL_KEY = [...SERVERS_LIST_KEY, "full", "all"] as const;

/** Servers snapshots summary. */
export const SERVERS_SNAPSHOTS_SUMMARY_KEY = [...SERVERS_LIST_KEY, "snapshots-summary"] as const;

/** Dashboard Top Issues: [...SERVERS_LIST_DASHBOARD_KEY, region?, status] */
export const SERVERS_LIST_DASHBOARD_KEY = [...SERVERS_LIST_KEY, "dashboard"] as const;

export const DOCKER_TELEMETRY_KEY = ["telemetry", "docker"] as const;

/** Overview stats and dashboard timeseries. */
export const OVERVIEW_KEY = ["overview"] as const;
export const DASHBOARD_TIMESERIES_KEY = ["overview", "dashboard_timeseries"] as const;
export const OPERATOR_DASHBOARD_KEY = ["dashboard", "operator"] as const;
export const CONNECTION_NODES_KEY = ["overview", "connection_nodes"] as const;

/** Audit log list (prefix; append offset, resourceType, etc. for full key). */
export const AUDIT_KEY = ["audit"] as const;

/** Devices list (prefix; append offset, searchTrigger, etc. for full key). */
export const DEVICES_KEY = ["devices"] as const;

/** Users list (prefix; append offset, filters, etc. for full key). */
export const USERS_KEY = ["users"] as const;

/** Single server (by id). */
export const serverKey = (id: string) => ["server", id] as const;

/** Server telemetry. */
export const serverTelemetryKey = (id: string) => ["server-telemetry", id] as const;

/** Server peers. */
export const serverPeersKey = (id: string) => ["server-peers", id] as const;

/** Peers list for server. */
export const peersKey = (serverId: string) => ["peers", serverId] as const;

/** Server actions. */
export const serverActionsKey = (id: string) => ["server-actions", id] as const;

/** Server logs. */
export const serverLogsKey = (serverId: string) => ["server-logs", serverId] as const;

/** Subscriptions list (prefix; append offset, search). */
export const SUBSCRIPTIONS_KEY = ["subscriptions"] as const;

/** Payments list (prefix; append offset, search). */
export const PAYMENTS_KEY = ["payments"] as const;

/** User detail (by id). */
export const userKey = (id: string) => ["user", id] as const;

/** Control plane sub-keys. */
export const CONTROL_PLANE_TOPOLOGY_SUMMARY_KEY = ["control-plane", "topology-summary"] as const;
export const CONTROL_PLANE_TOPOLOGY_GRAPH_KEY = ["control-plane", "topology-graph"] as const;
export const CONTROL_PLANE_BUSINESS_KEY = ["control-plane", "business"] as const;
export const CONTROL_PLANE_SECURITY_KEY = ["control-plane", "security"] as const;
export const CONTROL_PLANE_ANOMALY_KEY = ["control-plane", "anomaly"] as const;
export const CONTROL_PLANE_AUTOMATION_STATUS_KEY = ["control-plane", "automation-status"] as const;
export const CONTROL_PLANE_EVENTS_KEY = ["control-plane", "events"] as const;

/** Servers device counts. */
export const serversDeviceCountsKey = (skip404: boolean) =>
  [...SERVERS_LIST_KEY, "device-counts", skip404] as const;

/** Server IPs (drawer). */
export const serversIpsKey = (serverId: string) => [...SERVERS_LIST_KEY, serverId, "ips"] as const;

/** Server telemetry (drawer). */
export const serversTelemetryKey = (serverId: string) =>
  [...SERVERS_LIST_KEY, serverId, "telemetry"] as const;

/** Audit by server. */
export const auditServerKey = (serverId: string) => [...AUDIT_KEY, "server", serverId] as const;

/** Telemetry topology summary. */
export const TELEMETRY_TOPOLOGY_KEY = ["telemetry", "topology-summary"] as const;

/** Telemetry server. */
export const telemetryServerKey = (serverId: string) =>
  ["telemetry", "server", serverId] as const;

/** Cluster health (dashboard). */
export const CLUSTER_HEALTH_KEY = ["cluster", "health"] as const;

/** Analytics: telemetry services (scrape status). */
export const ANALYTICS_TELEMETRY_SERVICES_KEY = ["analytics", "telemetry", "services"] as const;
