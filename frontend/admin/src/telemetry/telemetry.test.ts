import { describe, it, expect, beforeEach } from "vitest";
import {
  TELEMETRY_EVENT_NAMES,
  validatePayload,
  isTelemetryEventName,
} from "./schema";
import * as ctx from "./context";
import { init, track, pageView, error, getTransportStats } from "./index";
import { initTransport, enqueue, getTransportStats as getClientStats, clearForTesting } from "./client";

describe("telemetry schema", () => {
  it("validates page_view payload", () => {
    const out = validatePayload("page_view", { route: "/servers" });
    expect(out).toEqual({ route: "/servers", referrer: undefined, tab_id: undefined });
  });

  it("rejects page_view without route", () => {
    expect(validatePayload("page_view", {})).toBeNull();
    expect(validatePayload("page_view", { route: 1 })).toBeNull();
  });

  it("validates api_request payload", () => {
    const out = validatePayload("api_request", {
      path: "/api/v1/servers",
      method: "GET",
      status: 200,
      duration_ms: 100,
      correlation_id: "abc",
    });
    expect(out?.path).toBe("/api/v1/servers");
    expect(out?.method).toBe("GET");
    expect(out?.status).toBe(200);
    expect(out?.duration_ms).toBe(100);
    expect(out?.correlation_id).toBe("abc");
  });

  it("validates frontend_error payload", () => {
    const out = validatePayload("frontend_error", {
      message: "Something broke",
      route: "/",
      component_stack: " at App",
    });
    expect(out?.message).toBe("Something broke");
    expect(out?.route).toBe("/");
    expect(out?.component_stack).toBe(" at App");
  });

  it("validates user_action payload", () => {
    const out = validatePayload("user_action", { action_type: "refresh", target_page: "/servers" });
    expect(out).toEqual({ action_type: "refresh", target_page: "/servers", extra: undefined });
  });

  it("validates servers_list_fetch payload", () => {
    const out = validatePayload("servers_list_fetch", {
      endpoint: "/api/v1/servers",
      status: 200,
      duration_ms: 50,
    });
    expect(out?.endpoint).toBe("/api/v1/servers");
    expect(out?.status).toBe(200);
    expect(out?.duration_ms).toBe(50);
  });

  it("validates stale_detected with numeric age_ms", () => {
    const out = validatePayload("stale_detected", {
      server_id: "s1",
      field: "status",
      age_ms: 120000,
    });
    expect(out).toEqual({ server_id: "s1", field: "status", age_ms: 120000 });
  });

  it("isTelemetryEventName returns true for catalog names", () => {
    for (const name of TELEMETRY_EVENT_NAMES) {
      expect(isTelemetryEventName(name)).toBe(true);
    }
  });

  it("isTelemetryEventName returns false for unknown names", () => {
    expect(isTelemetryEventName("unknown")).toBe(false);
    expect(isTelemetryEventName("")).toBe(false);
  });
});

describe("telemetry context", () => {
  beforeEach(() => {
    ctx.setContext({ route: undefined, build_hash: undefined });
  });

  it("getContext returns current snapshot", () => {
    ctx.setContext({ route: "/servers" });
    expect(ctx.getContext().route).toBe("/servers");
  });

  it("setContext merges partial", () => {
    ctx.setContext({ route: "/" });
    ctx.setContext({ build_hash: "abc" });
    const snapshot = ctx.getContext();
    expect(snapshot.route).toBe("/");
    expect(snapshot.build_hash).toBe("abc");
  });
});

describe("telemetry SSOT with mock transport", () => {
  beforeEach(() => {
    clearForTesting();
    initTransport({
      baseUrl: () => "http://test",
      sendFrontendErrors: false,
      debug: false,
    });
  });

  it("enqueue adds event with context attached", () => {
    ctx.setContext({ route: "/dashboard" });
    enqueue("page_view", { route: "/dashboard" });
    const stats = getClientStats();
    expect(stats.recent.length).toBe(1);
    const first = stats.recent[0];
    expect(first?.event).toBe("page_view");
    expect(first?.payload.route).toBe("/dashboard");
    expect(first?.context.route).toBe("/dashboard");
  });

  it("pageView updates route and emits page_view", () => {
    init({
      baseUrl: () => "http://test",
      sendFrontendErrors: false,
      debug: false,
    });
    pageView("/telemetry");
    const stats = getTransportStats();
    expect(stats.recent.some((e) => e.event === "page_view" && e.payload.route === "/telemetry")).toBe(true);
  });

  it("error emits frontend_error with message", () => {
    init({
      baseUrl: () => "http://test",
      sendFrontendErrors: false,
      debug: false,
    });
    error(new Error("test error"), { route: "/settings" });
    const stats = getTransportStats();
    const fe = stats.recent.find((e) => e.event === "frontend_error");
    expect(fe?.payload.message).toBe("test error");
    expect(fe?.payload.route).toBe("/settings");
  });

  it("track ignores invalid payload and does not crash", () => {
    init({
      baseUrl: () => "http://test",
      sendFrontendErrors: false,
      debug: false,
    });
    track("page_view", {} as { route: string });
    const stats = getTransportStats();
    const pv = stats.recent.filter((e) => e.event === "page_view");
    expect(pv.length).toBe(0);
  });
});
