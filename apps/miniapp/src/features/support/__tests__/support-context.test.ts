import { describe, expect, it } from "vitest";
import { webappMeActive } from "@/test/fixtures/session";
import {
  buildGuidanceTelemetryContext,
  buildSupportContext,
  persistSupportContext,
  readPersistedSupportContext,
  serializeSupportContext,
} from "../support-context";

describe("buildSupportContext", () => {
  it("captures a safe support handoff payload", () => {
    const payload = buildSupportContext({
      session: webappMeActive,
      currentRoute: "/support",
      lastAction: "support_opened",
      platform: "ios",
      locale: "en",
      guidanceContextId: "guidance-test-1",
    });

    expect(payload.user_id).toBe(1);
    expect(payload.tg_id).toBe(1001);
    expect(payload.device_count).toBe(0);
    expect(payload.device_limit).toBe(3);
    expect(payload.guidance_context_id).toBe("guidance-test-1");
    expect(payload.current_route).toBe("/support");
    expect(payload.last_action).toBe("support_opened");
    expect(payload.platform).toBe("ios");
    expect(payload.locale).toBe("en");
    expect(serializeSupportContext(payload)).not.toContain("PrivateKey");
  });

  it("projects a telemetry-safe guidance snapshot", () => {
    const payload = buildSupportContext({
      session: webappMeActive,
      currentRoute: "/devices",
      lastAction: "device_issue_started",
      platform: "android",
      locale: "ru",
      guidanceContextId: "guidance-test-2",
    });

    const telemetryPayload = buildGuidanceTelemetryContext(payload, "device_setup", 0, "add_device");

    expect(telemetryPayload).toMatchObject({
      guidance_context_id: payload.guidance_context_id,
      flow_stage: "device_setup",
      step_index: 0,
      step_id: "add_device",
      current_route: "/devices",
      last_action: "device_issue_started",
      device_count: payload.device_count,
      locale: "ru",
    });
    expect(telemetryPayload).not.toHaveProperty("user_id");
    expect(telemetryPayload).not.toHaveProperty("tg_id");
    expect(telemetryPayload).not.toHaveProperty("public_ip");
    expect(telemetryPayload).not.toHaveProperty("latest_device_id");
    expect(telemetryPayload).not.toHaveProperty("latest_device_name");
  });

  it("persists and restores the support handoff payload", () => {
    const payload = buildSupportContext({
      session: webappMeActive,
      currentRoute: "/support",
      lastAction: "support_contact_opened",
      platform: "desktop",
      locale: "en",
      guidanceContextId: "guidance-test-3",
    });

    persistSupportContext(payload);
    expect(readPersistedSupportContext()).toMatchObject({
      guidance_context_id: "guidance-test-3",
      current_route: "/support",
      last_action: "support_contact_opened",
      device_count: payload.device_count,
    });
  });
});
