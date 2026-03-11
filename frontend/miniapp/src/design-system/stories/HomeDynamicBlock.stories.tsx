import type { Meta, StoryObj } from "@storybook/react";
import { HomeDynamicBlock } from "../patterns";
import {
  buildDynamicProps,
  chromaticParameters,
  homeStoryDefaults,
  HomeStoryFrame,
  mobileStoryParameters,
  type HomeStoryArgs,
} from "./home.story-helpers";

const meta = {
  title: "Patterns/Home/HomeDynamicBlock",
  component: HomeDynamicBlock,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "HomeDynamicBlock surfaces up to two prioritized account or service signals. The stack is static, severity-aware, and tuned for expiry, device-capacity, bandwidth, and trial conditions.",
      },
    },
    ...chromaticParameters,
  },
} satisfies Meta<HomeStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

function renderDynamicBlock(args: HomeStoryArgs) {
  return (
    <HomeStoryFrame>
      <HomeDynamicBlock {...buildDynamicProps(args)} />
    </HomeStoryFrame>
  );
}

export const Healthy: Story = {
  args: { ...homeStoryDefaults, daysLeft: 30, deviceCount: 2, bandwidthRemainingPct: 55 },
  tags: ["chromatic"],
  render: renderDynamicBlock,
};

export const PlanExpiring: Story = {
  args: { ...homeStoryDefaults, daysLeft: 3, deviceCount: 2 },
  tags: ["chromatic"],
  render: renderDynamicBlock,
};

export const PlanExpired: Story = {
  args: { ...homeStoryDefaults, daysLeft: 0, deviceCount: 2 },
  tags: ["chromatic"],
  render: renderDynamicBlock,
};

export const DeviceLimit: Story = {
  args: { ...homeStoryDefaults, daysLeft: 30, deviceCount: 5, planLimit: 5 },
  render: renderDynamicBlock,
};

export const BandwidthLow: Story = {
  args: { ...homeStoryDefaults, bandwidthRemainingPct: 6, daysLeft: 30 },
  render: renderDynamicBlock,
};

export const MultiSignal: Story = {
  args: { ...homeStoryDefaults, daysLeft: 0, deviceCount: 5, planLimit: 5, bandwidthRemainingPct: 4 },
  tags: ["chromatic-release"],
  render: renderDynamicBlock,
};

export const MultiSignalMobile: Story = {
  args: { ...homeStoryDefaults, daysLeft: 0, deviceCount: 5, planLimit: 5, bandwidthRemainingPct: 4 },
  parameters: mobileStoryParameters,
  render: renderDynamicBlock,
};
