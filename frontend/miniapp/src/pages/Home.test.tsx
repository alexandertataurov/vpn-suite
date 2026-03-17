import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "./Home";
import { renderWithProviders } from "@/test/utils/render";

let mockModel: Record<string, unknown>;

vi.mock("@/page-models/useAccessHomePageModel", () => ({
  useAccessHomePageModel: () => mockModel,
}));

vi.mock("@/api/client", () => ({
  useWebappToken: () => "token",
}));

vi.mock("@/hooks/useSession", () => ({
  useSession: () => ({
    data: {
      user: { display_name: "Alex", photo_url: null },
    },
  }),
}));

function createBaseModel(overrides: Record<string, unknown> = {}) {
  return {
    pageState: { status: "ready" as const },
    status: "ready" as const,
    data: {
      status: "ready",
      has_plan: true,
      devices_used: 2,
      device_limit: 5,
      config_ready: true,
      config_id: "device-1",
      expires_at: "2030-05-01",
      amnezia_vpn_key: "https://t.me/example",
    },
    uiConfig: {
      title: "Your VPN is ready",
      description: "Open your configuration in AmneziaVPN",
      ctaLabel: "Open in AmneziaVPN",
      ctaDisabled: false,
      ctaAction: vi.fn(),
      showDevices: true,
      showExpiry: true,
      expiryLabel: "Valid until" as const,
    },
    showDevices: true,
    showExpiry: true,
    devicesValue: "2 / 5",
    expiryValue: "May 1, 2030",
    expiryLabel: "Valid until",
    onRetry: vi.fn(),
    ...overrides,
  };
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModel = createBaseModel();
  });

  it("renders ready state with hero and CTA", () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText("Your VPN is ready")).toBeInTheDocument();
    expect(screen.getByText("Open your configuration in AmneziaVPN")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open in AmneziaVPN/i })).toBeInTheDocument();
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
    expect(screen.getByText("May 1, 2030")).toBeInTheDocument();
  });

  it("renders needs_device state", () => {
    mockModel = createBaseModel({
      status: "needs_device",
      data: {
        status: "needs_device",
        has_plan: true,
        devices_used: 0,
        device_limit: 5,
        config_ready: false,
        config_id: null,
        expires_at: null,
        amnezia_vpn_key: null,
      },
      uiConfig: {
        title: "Add your device",
        description: "You need to add a device to generate your VPN configuration",
        ctaLabel: "Add Device",
        ctaDisabled: false,
        ctaAction: vi.fn(),
        showDevices: true,
        showExpiry: false,
      },
      showDevices: true,
      showExpiry: false,
      devicesValue: "0 / 5",
      expiryValue: "",
    });

    renderWithProviders(<HomePage />);

    expect(screen.getByText("Add your device")).toBeInTheDocument();
    expect(screen.getByText("You need to add a device to generate your VPN configuration")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Device/i })).toBeInTheDocument();
    expect(screen.getByText("0 / 5")).toBeInTheDocument();
  });

  it("renders no_plan state", () => {
    mockModel = createBaseModel({
      status: "no_plan",
      data: {
        status: "no_plan",
        has_plan: false,
        devices_used: 0,
        device_limit: null,
        config_ready: false,
        config_id: null,
        expires_at: null,
        amnezia_vpn_key: null,
      },
      uiConfig: {
        title: "No active plan",
        description: "Choose a plan to get VPN access",
        ctaLabel: "Choose Plan",
        ctaDisabled: false,
        ctaAction: vi.fn(),
        showDevices: false,
        showExpiry: false,
      },
      showDevices: false,
      showExpiry: false,
      devicesValue: "",
      expiryValue: "",
    });

    renderWithProviders(<HomePage />);

    expect(screen.getByText("No active plan")).toBeInTheDocument();
    expect(screen.getByText("Choose a plan to get VPN access")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Choose Plan/i })).toBeInTheDocument();
  });

  it("renders expired state", () => {
    mockModel = createBaseModel({
      status: "expired",
      data: {
        status: "expired",
        has_plan: true,
        devices_used: 2,
        device_limit: 5,
        config_ready: false,
        config_id: null,
        expires_at: "2030-03-10",
        amnezia_vpn_key: null,
      },
      uiConfig: {
        title: "Access expired",
        description: "Renew your plan to continue using VPN",
        ctaLabel: "Renew Access",
        ctaDisabled: false,
        ctaAction: vi.fn(),
        showDevices: false,
        showExpiry: true,
        expiryLabel: "Expired on" as const,
      },
      showDevices: false,
      showExpiry: true,
      devicesValue: "",
      expiryValue: "Mar 10, 2030",
      expiryLabel: "Expired on",
    });

    renderWithProviders(<HomePage />);

    expect(screen.getByText("Access expired")).toBeInTheDocument();
    expect(screen.getByText("Renew your plan to continue using VPN")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Renew Access/i })).toBeInTheDocument();
    expect(screen.getByText("Mar 10, 2030")).toBeInTheDocument();
  });

  it("renders support link in footer", () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText("View setup guide")).toBeInTheDocument();
  });
});
