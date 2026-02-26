/**
 * k6 load test: GET /telemetry/snapshot and GET /overview/operator
 * Usage: k6 run -e BASE_URL=http://localhost:8000 -e TOKEN=<jwt> scripts/telemetry-snapshot-k6.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";
const TOKEN = __ENV.TOKEN || "";

export const options = {
  scenarios: {
    snapshot_warm: {
      executor: "constant-vus",
      vus: 3,
      duration: "20s",
      exec: "snapshotRequest",
    },
    operator_warm: {
      executor: "constant-vus",
      vus: 2,
      duration: "20s",
      startTime: "2s",
      exec: "operatorRequest",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"],
  },
};

export function snapshotRequest() {
  const res = http.get(`${BASE_URL}/api/v1/telemetry/snapshot?scope=all`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  check(res, { "snapshot status 200": (r) => r.status === 200 });
  sleep(0.5);
}

export function operatorRequest() {
  const res = http.get(`${BASE_URL}/api/v1/overview/operator?time_range=1h`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  check(res, { "operator status 200": (r) => r.status === 200 });
  sleep(1);
}
