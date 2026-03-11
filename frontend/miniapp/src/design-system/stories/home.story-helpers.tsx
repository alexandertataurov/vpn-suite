import type { CSSProperties, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import type {
  HomeDynamicBlockProps,
  HomeHeroPanelProps,
  HomeHeroRouteQuality,
  HomePrimaryActionState,
  HomePrimaryActionZoneProps,
  HomeQuickActionGridProps,
} from "../patterns";
import {
  HomeDynamicBlock,
  HomeHeroPanel,
  HomePrimaryActionZone,
  HomeQuickActionGrid,
} from "../patterns";

export type HomeScreenPhase =
  | "loading"
  | "onboarding"
  | "no_plan"
  | "disconnected"
  | "connecting"
  | "connected"
  | "degraded"
  | "error";

export interface HomeStoryArgs {
  phase: HomeScreenPhase;
  latencyMs: number;
  daysLeft: number;
  bandwidthGb: number;
  bandwidthRemainingPct: number;
  deviceCount: number;
  planLimit: number;
  serverLocation: string;
  serverId: string;
  serverFlag: string;
  routeQuality: HomeHeroRouteQuality;
  subscriptionLabel: string;
  isStale: boolean;
  isTransitioning: boolean;
}

export const homeStoryDefaults: HomeStoryArgs = {
  phase: "connected",
  latencyMs: 127,
  daysLeft: 23,
  bandwidthGb: 124,
  bandwidthRemainingPct: 42,
  deviceCount: 2,
  planLimit: 5,
  serverLocation: "Frankfurt",
  serverId: "#3",
  serverFlag: "🇩🇪",
  routeQuality: "optimal",
  subscriptionLabel: "Pro plan",
  isStale: false,
  isTransitioning: false,
};

export const homeStoryArgTypes = {
  phase: {
    control: "select",
    options: ["loading", "onboarding", "no_plan", "disconnected", "connecting", "connected", "degraded", "error"],
  },
  latencyMs: { control: { type: "range", min: 0, max: 2000, step: 10 } },
  daysLeft: { control: { type: "range", min: 0, max: 365, step: 1 } },
  bandwidthGb: { control: { type: "range", min: 0, max: 500, step: 1 } },
  bandwidthRemainingPct: { control: { type: "range", min: 0, max: 100, step: 1 } },
  deviceCount: { control: { type: "range", min: 0, max: 10, step: 1 } },
  planLimit: { control: { type: "range", min: 1, max: 10, step: 1 } },
  serverLocation: { control: "text" },
  serverId: { control: "text" },
  serverFlag: { control: "text" },
  routeQuality: { control: "select", options: ["optimal", "degraded", "forced"] },
  subscriptionLabel: { control: "text" },
  isStale: {
    control: "boolean",
    description: "Cannot be true simultaneously with isTransitioning.",
  },
  isTransitioning: {
    control: "boolean",
    description: "Cannot be true simultaneously with isStale.",
  },
};

export const chromaticViewports = [375, 390];

export const mobileStoryParameters = {
  viewport: { defaultViewport: "mobile1" },
  layout: "centered",
  chromatic: { viewports: [375, 390] },
};

export const tabletStoryParameters = {
  viewport: { defaultViewport: "tablet" },
  chromatic: { viewports: [768] },
};

export const chromaticParameters = {
  chromatic: { viewports: chromaticViewports },
};

export function HomeStoryFrame({
  children,
  width = 420,
}: {
  children: ReactNode;
  width?: number | string;
}) {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <div className="page-shell--default page-shell--sectioned page-shell--centered" style={{ ...frameStyle, width }}>
        {children}
      </div>
    </MemoryRouter>
  );
}

export function buildHeroProps(args: HomeStoryArgs, overrides: Partial<HomeHeroPanelProps> = {}): HomeHeroPanelProps {
  const normalizedArgs = normalizeHomeStoryArgs(args);
  const latencyTone =
    normalizedArgs.phase === "no_plan" || normalizedArgs.phase === "disconnected"
      ? "mut"
      : normalizedArgs.phase === "error"
      ? "red"
      : normalizedArgs.latencyMs > 500
        ? "red"
        : normalizedArgs.latencyMs >= 100
          ? "amber"
          : "green";
  const latencyContextLabel =
    normalizedArgs.phase === "connecting" || normalizedArgs.phase === "loading"
      ? undefined
      : normalizedArgs.phase === "disconnected" || normalizedArgs.phase === "no_plan"
        ? undefined
        : normalizedArgs.latencyMs > 1500
          ? "Very high"
          : normalizedArgs.latencyMs > 500
            ? "High latency"
            : normalizedArgs.latencyMs >= 100
              ? "Advisory"
              : undefined;
  const timeLeftTone = normalizedArgs.daysLeft <= 1 ? "red" : normalizedArgs.daysLeft <= 3 ? "amber" : "green";
  const timeLeftActionLabel =
    normalizedArgs.phase === "no_plan"
      ? undefined
      : normalizedArgs.daysLeft <= 0
        ? "RENEW NOW"
        : normalizedArgs.daysLeft <= 3
          ? "Renew →"
          : undefined;
  const variant = phaseToHeroVariant(args.phase);
  const isNoPlan = normalizedArgs.phase === "no_plan";
  const isDisconnected = normalizedArgs.phase === "disconnected";

  return {
    variant,
    subscriptionLabel: isNoPlan ? "No plan" : normalizedArgs.subscriptionLabel,
    subscriptionShortLabel: isNoPlan ? "No plan" : normalizedArgs.subscriptionLabel,
    subscriptionTone: normalizedArgs.phase === "error" ? "red" : normalizedArgs.phase === "degraded" ? "amber" : isNoPlan ? "mut" : "green",
    latencyLabel:
      normalizedArgs.phase === "connecting"
        ? "Pending"
        : isDisconnected || isNoPlan
          ? "Offline"
          : `${normalizedArgs.latencyMs} ms`,
    latencyTone,
    latencyContextLabel,
    bandwidthLabel: isNoPlan ? "--" : `${normalizedArgs.bandwidthGb} GB`,
    bandwidthTone: isNoPlan ? "mut" : "teal",
    timeLeftLabel: isNoPlan ? "Not started" : `${normalizedArgs.daysLeft} days`,
    timeLeftTone: isNoPlan ? "mut" : timeLeftTone,
    timeLeftActionLabel,
    onTimeLeftPress:
      isNoPlan || normalizedArgs.phase === "loading" || normalizedArgs.phase === "onboarding"
        ? undefined
        : normalizedArgs.daysLeft <= 3
          ? () => undefined
          : undefined,
    onSubscriptionPress:
      isNoPlan || normalizedArgs.phase === "loading" || normalizedArgs.phase === "onboarding"
        ? undefined
        : () => undefined,
    lastUpdated: normalizedArgs.phase === "loading" ? undefined : normalizedArgs.isStale ? "43s ago" : "3s ago",
    isDataStale: normalizedArgs.isStale || normalizedArgs.phase === "error",
    flashLatency: normalizedArgs.phase === "connected" || normalizedArgs.phase === "degraded",
    attemptCount: normalizedArgs.phase === "connecting" ? 1 : normalizedArgs.phase === "error" ? undefined : 3,
    backoffLabel: undefined,
    serverFlag: normalizedArgs.serverFlag,
    serverLocation: isNoPlan ? undefined : normalizedArgs.serverLocation,
    serverId: isNoPlan ? undefined : normalizedArgs.serverId,
    showServerRow: !isNoPlan,
    routeQuality: normalizedArgs.phase === "error" ? "forced" : normalizedArgs.phase === "degraded" ? "degraded" : normalizedArgs.routeQuality,
    isServerLoading: normalizedArgs.phase === "connecting" || normalizedArgs.phase === "loading",
    onServerSelect: normalizedArgs.phase === "connecting" || normalizedArgs.phase === "loading" ? undefined : () => undefined,
    onHeroPress: normalizedArgs.phase === "loading" || normalizedArgs.phase === "onboarding" ? undefined : () => undefined,
    heroActionLabel:
      normalizedArgs.phase === "connected" || normalizedArgs.phase === "degraded" ? "Disconnect" : "Connect",
    onboardingTitle: "Import your AmneziaVPN config",
    onboardingDescription:
      "Start with the .conf import flow, validate credentials, and finish the first secure route setup.",
    ...overrides,
  };
}

export function buildActionProps(
  args: HomeStoryArgs,
  overrides: Partial<HomePrimaryActionZoneProps> = {},
): HomePrimaryActionZoneProps {
  const state = phaseToActionState(args.phase);
  return {
    state,
    isLoading: args.phase === "loading" || args.isTransitioning,
    loadingLabel:
      args.phase === "error" ? "Retrying…" : args.phase === "connecting" || args.isTransitioning ? "Connecting…" : "Loading…",
    onCancel: state === "connecting" ? () => undefined : undefined,
    onRetry: state === "error" ? () => undefined : undefined,
    supportTo: "/support",
    serverTo: "/servers",
    planTo: "/plan",
    connectTo: "/connect-status",
    setupTo: "/connect-status",
    devicesTo: "/devices",
    logsTo: "/support/logs",
    ...overrides,
  };
}

export function buildDynamicProps(
  args: HomeStoryArgs,
  overrides: Partial<HomeDynamicBlockProps> = {},
): HomeDynamicBlockProps {
  return {
    daysLeft: args.daysLeft,
    hasSub: args.phase !== "no_plan" && args.phase !== "onboarding",
    deviceLimit: args.planLimit,
    usedDevices: args.deviceCount,
    healthError: args.phase === "error" || args.phase === "degraded",
    bandwidthRemainingPercent: args.bandwidthRemainingPct,
    showUpsellExpiry: true,
    showUpsellDeviceLimit: true,
    renewalTargetTo: "/plan",
    upgradeTargetTo: "/plan",
    isTrial: false,
    maxVisible: 2,
    ...overrides,
  };
}

export function buildQuickActionProps(
  args: HomeStoryArgs,
  overrides: Partial<HomeQuickActionGridProps> = {},
): HomeQuickActionGridProps {
  return {
    hasSub: args.phase !== "no_plan" && args.phase !== "onboarding",
    status: args.phase === "connected" || args.phase === "degraded" ? "connected" : args.phase === "connecting" ? "connecting" : "disconnected",
    deviceCount: args.deviceCount,
    planLimit: args.planLimit,
    planKind: args.phase === "onboarding" ? "trial" : "paid",
    maxVisible: 4,
    ...overrides,
  };
}

export function renderHomeComposition(args: HomeStoryArgs) {
  const normalizedArgs = normalizeHomeStoryArgs(args);
  return (
    <HomeStoryFrame width="100%">
      <div className="page-stack--home">
        <HomeHeroPanel {...buildHeroProps(normalizedArgs)} />
        <HomePrimaryActionZone {...buildActionProps(normalizedArgs)} />
        <HomeDynamicBlock {...buildDynamicProps(normalizedArgs)} />
        <HomeQuickActionGrid {...buildQuickActionProps(normalizedArgs)} />
      </div>
    </HomeStoryFrame>
  );
}

export function normalizeHomeStoryArgs(args: HomeStoryArgs): HomeStoryArgs {
  if (args.isStale && args.isTransitioning) {
    console.warn("HomeHeroPanel: isStale and isTransitioning are mutually exclusive");
    return { ...args, isStale: false };
  }

  return args;
}

export function phaseToHeroVariant(phase: HomeScreenPhase): HomeHeroPanelProps["variant"] {
  if (phase === "loading") return "loading";
  if (phase === "onboarding") return "onboarding";
  if (phase === "no_plan") return "disconnected";
  return phase;
}

export function phaseToActionState(phase: HomeScreenPhase): HomePrimaryActionState {
  if (phase === "loading" || phase === "disconnected") return "disconnected";
  if (phase === "onboarding" || phase === "no_plan") return "no_plan";
  if (phase === "degraded") return "connected";
  if (phase === "error") return "error";
  return phase;
}

export const responsiveContract = [
  { viewport: "< 430px", heroLayout: "Single column, full width", ctaLayout: "Stacked buttons, full width" },
  { viewport: "430-768px", heroLayout: "Two columns", ctaLayout: "Inline primary + ghost link" },
  { viewport: "> 768px", heroLayout: "Three columns", ctaLayout: "Inline matrix layout" },
];

const frameStyle: CSSProperties = {
  display: "grid",
  gap: "var(--spacing-4)",
  maxWidth: "100%",
};
