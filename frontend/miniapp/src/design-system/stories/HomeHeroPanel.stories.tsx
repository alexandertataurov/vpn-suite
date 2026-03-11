import type { Meta, StoryObj } from "@storybook/react";
import { HomeHeroPanel } from "../patterns";
import {
  buildHeroProps,
  chromaticParameters,
  homeStoryArgTypes,
  homeStoryDefaults,
  HomeStoryFrame,
  mobileStoryParameters,
  normalizeHomeStoryArgs,
  tabletStoryParameters,
  type HomeStoryArgs,
} from "./home.story-helpers";

const meta = {
  title: "Patterns/Home/HomeHeroPanel",
  component: HomeHeroPanel,
  tags: ["autodocs"],
  argTypes: homeStoryArgTypes,
  parameters: {
    docs: {
      description: {
        component:
          "HomeHeroPanel is the stateful home hero for connection status, server identity, live telemetry, and onboarding/loading surfaces. Use Storybook controls to test latency, time left, bandwidth, server location, and stale-data thresholds. Long-press on mobile is the documented disconnect gesture; swipe is intentionally unsupported to avoid Telegram WebView conflicts.",
      },
    },
    ...chromaticParameters,
    ...mobileStoryParameters,
  },
} satisfies Meta<HomeStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

function renderHero(args: HomeStoryArgs) {
  const normalizedArgs = normalizeHomeStoryArgs(args);
  return (
    <HomeStoryFrame width="100%">
      <HomeHeroPanel {...buildHeroProps(normalizedArgs)} />
    </HomeStoryFrame>
  );
}

export const Connected: Story = {
  args: { ...homeStoryDefaults, phase: "connected" },
  tags: ["chromatic"],
  render: renderHero,
};

export const Connecting: Story = {
  args: { ...homeStoryDefaults, phase: "connecting", isTransitioning: true },
  tags: ["chromatic"],
  render: renderHero,
};

export const Reconnecting: Story = {
  args: { ...homeStoryDefaults, phase: "connecting", isStale: true },
  render: (args) => (
    <HomeStoryFrame>
      <HomeHeroPanel {...buildHeroProps(normalizeHomeStoryArgs(args), { variant: "reconnecting" })} />
    </HomeStoryFrame>
  ),
};

export const Degraded: Story = {
  args: { ...homeStoryDefaults, phase: "degraded", latencyMs: 612, routeQuality: "degraded" },
  tags: ["chromatic"],
  render: renderHero,
};

export const Error: Story = {
  args: { ...homeStoryDefaults, phase: "error", isStale: true },
  tags: ["chromatic"],
  render: renderHero,
};

export const Onboarding: Story = {
  args: { ...homeStoryDefaults, phase: "onboarding" },
  tags: ["chromatic"],
  render: renderHero,
};

export const Loading: Story = {
  args: { ...homeStoryDefaults, phase: "loading" },
  tags: ["chromatic"],
  render: renderHero,
};

export const LongSubscriptionName: Story = {
  args: {
    ...homeStoryDefaults,
    phase: "connected",
    subscriptionLabel: "Business Annual (Unlimited Seats)",
  },
  tags: ["chromatic-release"],
  render: renderHero,
};

export const HighLatency: Story = {
  args: {
    ...homeStoryDefaults,
    phase: "degraded",
    latencyMs: 1840,
    routeQuality: "degraded",
    isStale: true,
  },
  tags: ["chromatic-release"],
  render: renderHero,
};

export const ConnectedMobile: Story = {
  args: { ...homeStoryDefaults, phase: "connected" },
  parameters: mobileStoryParameters,
  tags: ["chromatic"],
  render: renderHero,
};

export const ConnectedTablet: Story = {
  args: { ...homeStoryDefaults, phase: "connected" },
  parameters: tabletStoryParameters,
  render: renderHero,
};

export const GestureContract: Story = {
  args: { ...homeStoryDefaults, phase: "connected" },
  parameters: mobileStoryParameters,
  render: renderHero,
};
