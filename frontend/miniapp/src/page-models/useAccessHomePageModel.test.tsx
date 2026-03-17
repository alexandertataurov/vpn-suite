import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { useAccessHomePageModel } from "./useAccessHomePageModel";

const mockGetUserAccess = vi.fn();

vi.mock("@/api", () => ({
  getUserAccess: () => mockGetUserAccess(),
}));

vi.mock("@/api/client", () => ({
  useWebappToken: () => "token",
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

let queryClient: QueryClient;

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useAccessHomePageModel", () => {
  beforeEach(() => {
    mockGetUserAccess.mockReset();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it("returns loading state while fetching", () => {
    mockGetUserAccess.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useAccessHomePageModel(), { wrapper });

    expect(result.current.pageState.status).toBe("loading");
    expect(result.current.status).toBe("loading");
  });

  it("maps no_plan to correct UI config", async () => {
    mockGetUserAccess.mockResolvedValue({
      status: "no_plan",
      has_plan: false,
      devices_used: 0,
      device_limit: null,
      config_ready: false,
      config_id: null,
      expires_at: null,
      amnezia_vpn_key: null,
    });

    const { result } = renderHook(() => useAccessHomePageModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.pageState.status).toBe("ready");
    });

    expect(result.current.status).toBe("no_plan");
    expect(result.current.uiConfig?.title).toBe("No active plan");
    expect(result.current.uiConfig?.description).toBe("Choose a plan to get VPN access");
    expect(result.current.uiConfig?.ctaLabel).toBe("Choose Plan");
    expect(result.current.showDevices).toBe(false);
    expect(result.current.showExpiry).toBe(false);
  });

  it("maps needs_device to correct UI config", async () => {
    mockGetUserAccess.mockResolvedValue({
      status: "needs_device",
      has_plan: true,
      devices_used: 0,
      device_limit: 5,
      config_ready: false,
      config_id: null,
      expires_at: null,
      amnezia_vpn_key: null,
    });

    const { result } = renderHook(() => useAccessHomePageModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.pageState.status).toBe("ready");
    });

    expect(result.current.status).toBe("needs_device");
    expect(result.current.uiConfig?.title).toBe("Add your device");
    expect(result.current.uiConfig?.ctaLabel).toBe("Add Device");
    expect(result.current.showDevices).toBe(true);
    expect(result.current.devicesValue).toBe("0 / 5");
  });

  it("maps ready to correct UI config with amnezia_vpn_key", async () => {
    mockGetUserAccess.mockResolvedValue({
      status: "ready",
      has_plan: true,
      devices_used: 2,
      device_limit: 5,
      config_ready: true,
      config_id: "dev-1",
      expires_at: "2030-05-01",
      amnezia_vpn_key: "https://t.me/example",
    });

    const { result } = renderHook(() => useAccessHomePageModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.pageState.status).toBe("ready");
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.uiConfig?.title).toBe("Your VPN is ready");
    expect(result.current.uiConfig?.ctaLabel).toBe("Open in AmneziaVPN");
    expect(result.current.showDevices).toBe(true);
    expect(result.current.showExpiry).toBe(true);
    expect(result.current.devicesValue).toBe("2 / 5");
    expect(result.current.expiryValue).toContain("2030");
  });

  it("maps expired to correct UI config", async () => {
    mockGetUserAccess.mockResolvedValue({
      status: "expired",
      has_plan: true,
      devices_used: 2,
      device_limit: 5,
      config_ready: false,
      config_id: null,
      expires_at: "2030-03-10",
      amnezia_vpn_key: null,
    });

    const { result } = renderHook(() => useAccessHomePageModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.pageState.status).toBe("ready");
    });

    expect(result.current.status).toBe("expired");
    expect(result.current.uiConfig?.title).toBe("Access expired");
    expect(result.current.uiConfig?.ctaLabel).toBe("Renew Access");
    expect(result.current.uiConfig?.expiryLabel).toBe("Expired on");
  });

  it("maps device_limit to correct UI config", async () => {
    mockGetUserAccess.mockResolvedValue({
      status: "device_limit",
      has_plan: true,
      devices_used: 5,
      device_limit: 5,
      config_ready: false,
      config_id: null,
      expires_at: null,
      amnezia_vpn_key: null,
    });

    const { result } = renderHook(() => useAccessHomePageModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.pageState.status).toBe("ready");
    });

    expect(result.current.status).toBe("device_limit");
    expect(result.current.uiConfig?.title).toBe("Device limit reached");
    expect(result.current.uiConfig?.ctaLabel).toBe("Manage Devices");
  });

  it("returns error state when fetch fails", async () => {
    mockGetUserAccess.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAccessHomePageModel(), { wrapper });

    await waitFor(() => {
      expect(result.current.pageState.status).toBe("error");
    });

    expect(result.current.pageState.title).toBe("Something went wrong");
    expect(result.current.pageState.onRetry).toBeDefined();
  });
});
