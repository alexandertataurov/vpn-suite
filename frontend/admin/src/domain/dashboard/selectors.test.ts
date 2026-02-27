import { describe, it, expect } from "vitest";
import type { OperatorDashboardOut } from "@vpn-suite/shared/types";
import {
  selectHealthStrip,
  selectTimeseriesForChart,
  selectIncidents,
  selectClusterMatrix,
  selectNodeCoverageFromStrip,
  selectServers,
  selectDataStatus,
  selectLastSuccessfulSampleTs,
} from "./selectors";

const fixture: OperatorDashboardOut = {
  health_strip: {
    api_status: "ok",
    prometheus_status: "ok",
    total_nodes: 10,
    online_nodes: 8,
    active_sessions: 4,
    peers_active: 12,
    total_throughput_bps: 1_000_000,
    avg_latency_ms: 5,
    error_rate_pct: 0.1,
    last_updated: "2025-01-01T12:00:00Z",
    refresh_mode: "auto",
    freshness: "fresh",
  },
  cluster_matrix: [
    {
      region: "eu",
      total_nodes: 5,
      online: 4,
      cpu_avg: 20,
      ram_avg: 60,
      users: 10,
      throughput: 500_000,
      error_pct: 0,
      latency_p95: 4,
      health: "ok",
    },
  ],
  incidents: [
    {
      severity: "warning",
      entity: "server-1",
      metric: "latency",
      value: 100,
      timestamp: "2025-01-01T12:00:00Z",
      link: "/servers/1",
    },
  ],
  servers: [
    {
      id: "s1",
      name: "node-1",
      region: "eu",
      ip: "10.0.0.1",
      status: "online",
      cpu_pct: 10,
      ram_pct: 50,
      users: 2,
      throughput_bps: 100_000,
      last_heartbeat: "2025-01-01T12:00:00Z",
      freshness: "fresh",
      to: "/servers/s1",
    },
  ],
  timeseries: [
    { ts: 1_700_000_000, peers: 5, rx: 1000, tx: 500 },
    { ts: 1_700_000_060, peers: 6, rx: 1200, tx: 600 },
  ],
  user_sessions: {
    active_users: 4,
    new_sessions_per_min: 1,
    peak_concurrency_24h: 10,
    delta_1h: 0,
    delta_24h: 0,
  },
  last_updated: "2025-01-01T12:00:00Z",
  data_status: "ok",
  last_successful_sample_ts: "2025-01-01T12:00:00Z",
};

describe("dashboard selectors", () => {
  describe("selectHealthStrip", () => {
    it("returns null for null/undefined payload", () => {
      expect(selectHealthStrip(null)).toBeNull();
      expect(selectHealthStrip(undefined)).toBeNull();
    });

    it("returns StripView with camelCase from health_strip", () => {
      const strip = selectHealthStrip(fixture);
      expect(strip).not.toBeNull();
      expect(strip!.apiStatus).toBe("ok");
      expect(strip!.onlineNodes).toBe(8);
      expect(strip!.lastUpdated).toBe("2025-01-01T12:00:00Z");
      expect(strip!.freshness).toBe("fresh");
    });
  });

  describe("selectTimeseriesForChart", () => {
    it("returns null for null payload", () => {
      expect(selectTimeseriesForChart(null)).toBeNull();
    });

    it("returns series and last-value strings", () => {
      const chart = selectTimeseriesForChart(fixture);
      expect(chart).not.toBeNull();
      expect(chart!.download).toHaveLength(2);
      expect(chart!.download[0]).toEqual([1_700_000_000 * 1000, 1000]);
      expect(chart!.upload[0]).toEqual([1_700_000_000 * 1000, 500]);
      expect(chart!.connections[0]).toEqual([1_700_000_000 * 1000, 5]);

      // Derived throughput/latency series exist and align with points
      expect(chart!.throughputBps).toHaveLength(2);
      expect(chart!.latencyMs).toHaveLength(2);

      expect(chart!.lastThroughputStr).toMatch(/\d/);
      expect(chart!.lastConnectionsStr).toBe("6");
      expect(chart!.lastThroughputRateStr).toMatch(/\/s$/);
      expect(chart!.lastLatencyStr).toMatch(/ms|s$/);
    });
  });

  describe("selectIncidents", () => {
    it("returns empty array for no incidents", () => {
      expect(selectIncidents({ ...fixture, incidents: [] })).toEqual([]);
    });

    it("returns IncidentForPanel array with camelCase", () => {
      const list = selectIncidents(fixture);
      expect(list).toHaveLength(1);
      expect(list[0]!.severity).toBe("warning");
      expect(list[0]!.entity).toBe("server-1");
    });
  });

  describe("selectClusterMatrix", () => {
    it("returns empty array for no matrix", () => {
      expect(selectClusterMatrix({ ...fixture, cluster_matrix: [] })).toEqual([]);
    });

    it("returns ClusterMatrixRow array with camelCase", () => {
      const rows = selectClusterMatrix(fixture);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.region).toBe("eu");
      expect(rows[0]!.totalNodes).toBe(5);
      expect(rows[0]!.health).toBe("ok");
    });
  });

  describe("selectNodeCoverageFromStrip", () => {
    it("returns null for null payload", () => {
      expect(selectNodeCoverageFromStrip(null)).toBeNull();
    });

    it("derives coverage from health_strip", () => {
      const cov = selectNodeCoverageFromStrip(fixture);
      expect(cov).not.toBeNull();
      expect(cov!.total).toBe(10);
      expect(cov!.online).toBe(8);
      expect(cov!.down).toBe(2);
      expect(cov!.reportingCount).toBe(8);
    });
  });

  describe("selectServers", () => {
    it("returns empty array for no servers", () => {
      expect(selectServers({ ...fixture, servers: [] })).toEqual([]);
    });

    it("returns ServerRowView array with camelCase", () => {
      const rows = selectServers(fixture);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.id).toBe("s1");
      expect(rows[0]!.throughputBps).toBe(100_000);
    });
  });

  describe("selectDataStatus", () => {
    it("returns data_status when present", () => {
      expect(selectDataStatus(fixture)).toBe("ok");
      expect(selectDataStatus({ ...fixture, data_status: "degraded" })).toBe("degraded");
    });

    it("returns undefined for null or missing", () => {
      expect(selectDataStatus(null)).toBeUndefined();
      expect(selectDataStatus({ ...fixture, data_status: undefined })).toBeUndefined();
    });
  });

  describe("selectLastSuccessfulSampleTs", () => {
    it("returns last_successful_sample_ts when present", () => {
      expect(selectLastSuccessfulSampleTs(fixture)).toBe("2025-01-01T12:00:00Z");
    });

    it("returns null for null or missing", () => {
      expect(selectLastSuccessfulSampleTs(null)).toBeNull();
      expect(selectLastSuccessfulSampleTs({ ...fixture, last_successful_sample_ts: undefined })).toBeNull();
    });
  });
});
