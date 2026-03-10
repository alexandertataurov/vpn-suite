import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import type { WebAppServersResponse } from "@vpn-suite/shared";
import { useServerSelectionPageModel } from "./useServerSelectionPageModel";

const mockUseWebappToken = vi.fn();
const mockUseOnlineStatus = vi.fn();
const mockWebappGet = vi.fn();
const mockWebappPost = vi.fn();
const mockAddToast = vi.fn();
const mockTrack = vi.fn();

vi.mock("@/api/client", () => ({
  useWebappToken: () => mockUseWebappToken(),
  webappApi: {
    get: (...args: unknown[]) => mockWebappGet(...args),
    post: (...args: unknown[]) => mockWebappPost(...args),
  },
}));

vi.mock("@/hooks/useOnlineStatus", () => ({
  useOnlineStatus: () => mockUseOnlineStatus(),
}));

vi.mock("@/hooks/useSession", () => ({
  useSession: () => ({
    data: {
      subscriptions: [{ plan_id: "plan-basic" }],
    },
  }),
}));

vi.mock("@/hooks/useTelemetry", () => ({
  useTelemetry: () => ({ track: (...args: unknown[]) => mockTrack(...args) }),
}));

vi.mock("@/design-system", () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock("@/lib/query-keys/webapp.query-keys", () => ({
  webappQueryKeys: {
    servers: () => ["servers"],
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useServerSelectionPageModel", () => {
  beforeEach(() => {
    mockUseWebappToken.mockReturnValue("token");
    mockUseOnlineStatus.mockReturnValue(true);
    mockWebappGet.mockReset();
    mockWebappPost.mockReset();
    mockAddToast.mockReset();
    mockTrack.mockReset();
  });

  it("emits server_switched telemetry on successful manual selection", async () => {
    const servers: WebAppServersResponse = {
      items: [
        {
          id: "srv-1",
          name: "Server 1",
          is_current: false,
        } as WebAppServersResponse["items"][number],
      ],
    };
    mockWebappGet.mockResolvedValue(servers);
    mockWebappPost.mockResolvedValue({});

    const { result } = renderHook(() => useServerSelectionPageModel(), { wrapper });

    await act(async () => {
      // wait initial query resolution
      await Promise.resolve();
    });

    const server = servers.items[0];

    await act(async () => {
      result.current.handleSelectServer(server);
    });

    expect(mockWebappPost).toHaveBeenCalledWith("/webapp/servers/select", {
      server_id: "srv-1",
      mode: "manual",
    });
    expect(mockTrack).toHaveBeenCalledWith("server_switched", {
      screen_name: "servers",
      server_id: "srv-1",
    });
  });

  it("sets error pageState when offline", async () => {
    mockUseOnlineStatus.mockReturnValue(false);
    mockWebappGet.mockResolvedValue({ items: [] });

    const { result } = renderHook(() => useServerSelectionPageModel(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.pageState.status).toBe("error");
    if (result.current.pageState.status === "error") {
      expect(result.current.pageState.title).toBe("Offline");
    }
  });
});

