import { afterEach, describe, expect, it, vi } from "vitest";
import { getWebappToken, webappApi } from "@/api/client";
import { flushTelemetryQueue, sendWebappTelemetry } from "./telemetry";

vi.mock("@/api/client", () => ({
  getWebappToken: vi.fn(),
  webappApi: {
    post: vi.fn(),
  },
}));

describe("sendWebappTelemetry", () => {
  afterEach(() => {
    vi.mocked(getWebappToken).mockReturnValue("token");
  });

  it("posts typed event with build_version", async () => {
    vi.mocked(getWebappToken).mockReturnValue("token");
    const postMock = vi.mocked(webappApi.post);
    postMock.mockResolvedValueOnce(undefined);

    await sendWebappTelemetry("cta_click", {
      cta_name: "test_cta",
      screen_name: "test_screen",
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    const [url, body] = postMock.mock.calls[0] as [string, { event_type: string; payload: Record<string, unknown> }];
    expect(url).toBe("/webapp/telemetry");
    expect(body.event_type).toBe("cta_click");
    expect(body.payload).toMatchObject({
      cta_name: "test_cta",
      screen_name: "test_screen",
    });
    expect(typeof body.payload.build_version).toBe("string");
  });

  it("queues when no token and does not post", async () => {
    const postMock = vi.mocked(webappApi.post);
    postMock.mockClear();
    vi.mocked(getWebappToken).mockReturnValue(null);

    await sendWebappTelemetry("app_open", {});

    expect(postMock).not.toHaveBeenCalled();
  });

  it("flushTelemetryQueue sends queued events", async () => {
    const postMock = vi.mocked(webappApi.post);
    postMock.mockResolvedValue(undefined);
    flushTelemetryQueue(); // drain any queue from previous test
    postMock.mockClear();

    vi.mocked(getWebappToken).mockReturnValue(null);
    await sendWebappTelemetry("app_open", {});
    flushTelemetryQueue();

    expect(postMock).toHaveBeenCalledTimes(1);
    const [, body] = postMock.mock.calls[0] as [string, { event_type: string; payload: Record<string, unknown> }];
    expect(body.event_type).toBe("app_open");
    expect(body.payload).toHaveProperty("build_version");
  });

  it("swallows errors from backend", async () => {
    vi.mocked(getWebappToken).mockReturnValue("token");
    const postMock = vi.mocked(webappApi.post);
    postMock.mockRejectedValueOnce(new Error("network"));

    await expect(sendWebappTelemetry("app_open", {})).resolves.toBeUndefined();
  });
});
