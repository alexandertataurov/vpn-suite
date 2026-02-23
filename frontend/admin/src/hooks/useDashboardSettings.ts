import { useState, useEffect, useCallback, useRef } from "react";

const NS = "vpn-suite-admin-dashboard";
const DEBOUNCE_MS = 300;

export type DashboardDensity = "compact" | "comfortable";
export type DashboardTimeRange = "1h" | "6h" | "24h" | "7d";
export type AutoRefreshInterval = 0 | 15 | 30 | 60;

export interface VisibleWidgets {
  health: boolean;
  capacity: boolean;
  trends: boolean;
  topIssues: boolean;
  recentAudit: boolean;
}

export const DEFAULT_VISIBLE_WIDGETS: VisibleWidgets = {
  health: true,
  capacity: true,
  trends: true,
  topIssues: true,
  recentAudit: true,
};

export interface DashboardSettings {
  density: DashboardDensity;
  autoRefreshInterval: AutoRefreshInterval;
  defaultTimeRange: DashboardTimeRange;
  visibleWidgets: VisibleWidgets;
  pinnedRegion: string | null;
}

const DEFAULTS: DashboardSettings = {
  density: "comfortable",
  autoRefreshInterval: 60,
  defaultTimeRange: "24h",
  visibleWidgets: DEFAULT_VISIBLE_WIDGETS,
  pinnedRegion: null,
};

function getKey(key: keyof DashboardSettings): string {
  return `${NS}:${key}`;
}

function read<K extends keyof DashboardSettings>(key: K): DashboardSettings[K] {
  if (typeof localStorage === "undefined") return DEFAULTS[key];
  const raw = localStorage.getItem(getKey(key));
  if (raw == null) return DEFAULTS[key];
  try {
    if (key === "visibleWidgets") {
      const parsed = JSON.parse(raw) as Partial<VisibleWidgets>;
      return { ...DEFAULT_VISIBLE_WIDGETS, ...parsed } as DashboardSettings[K];
    }
    if (key === "pinnedRegion") return (raw === "" ? null : raw) as DashboardSettings[K];
    if (key === "autoRefreshInterval") {
      const n = parseInt(raw, 10);
      if ([0, 15, 30, 60].includes(n)) return n as DashboardSettings[K];
      return DEFAULTS[key];
    }
    if (key === "density" && (raw === "compact" || raw === "comfortable")) return raw as DashboardSettings[K];
    if (key === "defaultTimeRange" && ["1h", "6h", "24h", "7d"].includes(raw)) return raw as DashboardSettings[K];
    return DEFAULTS[key];
  } catch {
    return DEFAULTS[key];
  }
}

function write<K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]): void {
  if (typeof localStorage === "undefined") return;
  const k = getKey(key);
  if (key === "visibleWidgets") localStorage.setItem(k, JSON.stringify(value));
  else if (key === "pinnedRegion") localStorage.setItem(k, value === null ? "" : String(value));
  else localStorage.setItem(k, String(value));
}

function loadSettings(): DashboardSettings {
  return {
    density: read("density") as DashboardDensity,
    autoRefreshInterval: read("autoRefreshInterval") as AutoRefreshInterval,
    defaultTimeRange: read("defaultTimeRange") as DashboardTimeRange,
    visibleWidgets: read("visibleWidgets") as VisibleWidgets,
    pinnedRegion: read("pinnedRegion"),
  };
}

export function useDashboardSettings(): [DashboardSettings, (key: keyof DashboardSettings, value: DashboardSettings[keyof DashboardSettings]) => void] {
  const [settings, setSettings] = useState<DashboardSettings>(() => (typeof window === "undefined" ? DEFAULTS : loadSettings()));
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWrites = useRef<Partial<Record<keyof DashboardSettings, DashboardSettings[keyof DashboardSettings]>>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSettings(loadSettings());
  }, []);

  const flushWrites = useCallback(() => {
    if (pending.current) {
      clearTimeout(pending.current);
      pending.current = null;
    }
    const w = pendingWrites.current;
    for (const key of Object.keys(w) as (keyof DashboardSettings)[]) {
      const v = w[key];
      if (v !== undefined) write(key, v);
    }
    pendingWrites.current = {};
  }, []);

  const updateSetting = useCallback(
    (key: keyof DashboardSettings, value: DashboardSettings[keyof DashboardSettings]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      pendingWrites.current[key] = value;
      if (pending.current) clearTimeout(pending.current);
      pending.current = setTimeout(flushWrites, DEBOUNCE_MS);
    },
    [flushWrites]
  );

  useEffect(() => () => {
    if (pending.current) clearTimeout(pending.current);
  }, []);

  return [settings, updateSetting];
}
