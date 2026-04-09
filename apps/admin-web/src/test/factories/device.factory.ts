import type { DeviceOut } from "@/shared/types/admin-api";

let deviceCounter = 0;

function nextId() {
  deviceCounter += 1;
  return `device-${deviceCounter}`;
}

export const deviceFactory = {
  build(overrides?: Partial<DeviceOut>): DeviceOut {
    const id = overrides?.id ?? nextId();
    return {
      id,
      user_id: 1,
      subscription_id: "sub-1",
      server_id: "srv-1",
      device_name: "Test Device",
      public_key: `pub-${id}`,
      allowed_ips: "10.0.0.2/32",
      issued_at: "2026-01-01T00:00:00.000Z",
      revoked_at: null,
      suspended_at: null,
      data_limit_bytes: null,
      expires_at: null,
      created_at: "2026-01-01T00:00:00.000Z",
      issued_configs: [],
      user_email: "qa@example.com",
      telemetry: null,
      apply_status: null,
      last_applied_at: null,
      last_seen_handshake_at: null,
      last_error: null,
      protocol_version: "awg-v1",
      ...overrides,
    };
  },
  buildList(count: number, overrides?: Partial<DeviceOut>): DeviceOut[] {
    return Array.from({ length: count }, () => this.build(overrides));
  },
  offline(overrides?: Partial<DeviceOut>): DeviceOut {
    const id = overrides?.id ?? nextId();
    return this.build({
      id,
      telemetry: {
        device_id: id,
        peer_present: false,
        node_health: "offline",
        config_state: "issued",
        reconciliation_status: "needs_reconcile",
      },
      ...overrides,
    });
  },
};
