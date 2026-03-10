import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createApiClientMock = vi.fn();
const getBaseUrlMock = vi.fn(() => "https://api.example.com");

vi.mock("@/lib/api-client", () => ({
  createApiClient: (...args: unknown[]) => createApiClientMock(...args),
  getBaseUrl: () => getBaseUrlMock(),
}));

describe("api/client", () => {
  beforeEach(() => {
    vi.resetModules();
    createApiClientMock.mockReset();
    getBaseUrlMock.mockClear();
    createApiClientMock.mockReturnValue({ marker: "api" });
  });

  it("wires the API client with base URL and token getter", async () => {
    const mod = await import("./client");

    expect(createApiClientMock).toHaveBeenCalledTimes(1);
    expect(getBaseUrlMock).toHaveBeenCalledTimes(1);
    expect(mod.webappApi).toEqual({ marker: "api" });
    expect(createApiClientMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        baseUrl: "https://api.example.com",
        getToken: expect.any(Function),
        onUnauthorized: expect.any(Function),
      }),
    );
  });

  it("stores token state and exposes it through the hook", async () => {
    const mod = await import("./client");

    act(() => {
      mod.setWebappToken("token-1", 60);
    });
    expect(mod.getWebappToken()).toBe("token-1");
    expect(mod.getWebappTokenExpiresAt()).toBeGreaterThan(Date.now());

    const { result } = renderHook(() => mod.useWebappToken());
    expect(result.current).toBe("token-1");

    act(() => {
      mod.setWebappToken("token-1");
    });
    expect(mod.getWebappToken()).toBe("token-1");

    act(() => {
      mod.setWebappToken(null);
    });
    expect(mod.getWebappToken()).toBeNull();
    expect(mod.getWebappTokenExpiresAt()).toBeNull();
  });

  it("clears the token and dispatches unauthorized event", async () => {
    const mod = await import("./client");
    act(() => {
      mod.setWebappToken("token-2", 60);
    });

    const listener = vi.fn();
    window.addEventListener("webapp:unauthorized", listener);

    const options = createApiClientMock.mock.calls[0]?.[0] as { onUnauthorized: () => void };
    options.onUnauthorized();

    expect(mod.getWebappToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
