import type { WebAppMeDevice } from "@vpn-suite/shared";

export const activeDevicesFixture: WebAppMeDevice[] = [
  {
    id: "dev-01",
    device_name: "MacBook Pro",
    issued_at: "2026-02-10T08:12:00Z",
    revoked_at: null,
  },
  {
    id: "dev-02",
    device_name: "Pixel 8",
    issued_at: "2026-02-11T09:42:00Z",
    revoked_at: null,
  },
  {
    id: "dev-03",
    device_name: "iPhone",
    issued_at: "2026-02-01T13:25:00Z",
    revoked_at: "2026-02-15T16:40:00Z",
  },
] as const satisfies readonly WebAppMeDevice[];
