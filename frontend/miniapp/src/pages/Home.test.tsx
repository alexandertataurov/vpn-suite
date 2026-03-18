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
      description: "Manage your devices and subscription here. Connect in AmneziaVPN.",
      ctaLabel: "Manage Devices",
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
    pillChip: { variant: "active" as const, label: "PRO" },
    showNewUserHero: false,
    showPlanHero: true,
    planHeroData: {
      eyebrow: "YOUR PLAN",
      planName: "Pro",
      subtitle: "5 devices · annual",
      status: "active" as const,
      stats: [
        { label: "DEVICES", value: "2", dim: " / 5", tone: "default" as const },
        { label: "Renews", value: "May 1", tone: "default" as const },
        { label: "TRAFFIC", value: "∞", tone: "default" as const },
      ],
    },
    showRenewalBanner: false,
    showNoDeviceCallout: false,
    subscriptionSubtitle: "Pro annual · renews May 1",
    subscriptionLabel: "Subscription",
    devicesSubtitle: "2 of 5 active",
    daysLeft: null,
    expiryDateShort: "May 1",
    onRetry: vi.fn(),
    ...overrides,
  };
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModel = createBaseModel();
  });

  it("renders ready state with hero and nav rows", () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText("YOUR PLAN")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Manage Devices")).toBeInTheDocument();
    expect(screen.getByText("Subscription")).toBeInTheDocument();
    expect(screen.getByText("Invite Friends")).toBeInTheDocument();
    expect(screen.getByText("2 of 5 active")).toBeInTheDocument();
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
      pillChip: { variant: "active" as const, label: "PRO" },
      showPlanHero: true,
      showNoDeviceCallout: true,
      subscriptionSubtitle: "Pro annual",
      subscriptionLabel: "Subscription",
      devicesSubtitle: "None added yet",
      planHeroData: {
        eyebrow: "YOUR PLAN",
        planName: "Pro",
        subtitle: "5 devices · annual",
        status: "active" as const,
        stats: [
          { label: "DEVICES", value: "0", dim: " / 5", tone: "default" as const },
          { label: "Renews", value: "—", tone: "default" as const },
          { label: "TRAFFIC", value: "∞", tone: "default" as const },
        ],
      },
    });

    renderWithProviders(<HomePage />);

    expect(screen.getByText("No devices added")).toBeInTheDocument();
    expect(screen.getByText("Add a device to generate your configuration.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Device/i })).toBeInTheDocument();
    expect(screen.getByText("YOUR PLAN")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
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
      pillChip: { variant: "beta" as const, label: "Beta" },
      showNewUserHero: true,
      showPlanHero: false,
      planHeroData: null,
    });

    renderWithProviders(<HomePage />);

    expect(screen.getByText("Setup Required")).toBeInTheDocument();
    expect(screen.getByText(/Choose a plan and add a device to get your secure configuration/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Choose a Plan/i })).toBeInTheDocument();
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
      pillChip: { variant: "expired" as const, label: "Expired" },
      showPlanHero: true,
      showRenewalBanner: true,
      planHeroData: {
        eyebrow: "YOUR PLAN",
        planName: "Pro",
        subtitle: "5 devices · annual",
        status: "expired" as const,
        stats: [
          { label: "DEVICES", value: "2", dim: " / 5", tone: "default" as const },
          { label: "Expired", value: "Mar 10, 2030", tone: "expired" as const },
          { label: "TRAFFIC", value: "∞", tone: "default" as const },
        ],
      },
      subscriptionLabel: "Renew Subscription",
      subscriptionSubtitle: "Pro annual",
      devicesSubtitle: "2 devices · access paused",
      daysLeft: null,
      expiryDateShort: "Mar 10",
    });

    renderWithProviders(<HomePage />);

    expect(screen.getByText("Subscription expired")).toBeInTheDocument();
    expect(screen.getByText("Renew now to restore access on all devices.")).toBeInTheDocument();
    expect(screen.getByText("Renew Subscription")).toBeInTheDocument();
    expect(screen.getByText("Renew")).toBeInTheDocument();
  });

  it("renders support link in footer", () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText("View setup guide")).toBeInTheDocument();
  });
});
