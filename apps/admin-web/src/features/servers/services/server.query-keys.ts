export const serverKeys = {
  all: ["servers"] as const,
  details: () => [...serverKeys.all, "detail"] as const,
  detail: (serverId: string) => [...serverKeys.details(), serverId] as const,
  settingsLists: () => [...serverKeys.all, "settings", "list"] as const,
  settingsList: (path: string) => [...serverKeys.settingsLists(), path] as const,
  snapshotsSummary: () => [...serverKeys.all, "snapshots", "summary"] as const,
  vpnNodes: () => [...serverKeys.all, "vpn-nodes"] as const,
  vpnNodeDetail: (serverId: string) => [...serverKeys.all, "vpn-node", serverId] as const,
};

