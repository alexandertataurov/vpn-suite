import type { Meta, StoryObj } from "@storybook/react";
import { HomePrimaryActionZone } from "../patterns";
import {
  buildActionProps,
  chromaticParameters,
  homeStoryDefaults,
  HomeStoryFrame,
  mobileStoryParameters,
  type HomeStoryArgs,
} from "./home.story-helpers";

const meta = {
  title: "Patterns/Home/HomePrimaryActionZone",
  component: HomePrimaryActionZone,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "HomePrimaryActionZone renders the home CTA matrix. Primary, secondary, and ghost actions are derived from state rather than manually composed, with an explicit loading/transition treatment for connect and retry flows.",
      },
    },
    ...chromaticParameters,
  },
} satisfies Meta<HomeStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

function renderActionZone(args: HomeStoryArgs) {
  return (
    <HomeStoryFrame>
      <HomePrimaryActionZone {...buildActionProps(args)} />
    </HomeStoryFrame>
  );
}

export const NoPlan: Story = {
  args: { ...homeStoryDefaults, phase: "no_plan" },
  tags: ["chromatic"],
  render: renderActionZone,
};

export const HasPlanDisconnected: Story = {
  args: { ...homeStoryDefaults, phase: "disconnected" },
  tags: ["chromatic"],
  render: renderActionZone,
};

export const Connecting: Story = {
  args: { ...homeStoryDefaults, phase: "connecting", isTransitioning: true },
  tags: ["chromatic"],
  render: renderActionZone,
};

export const Connected: Story = {
  args: { ...homeStoryDefaults, phase: "connected" },
  tags: ["chromatic"],
  render: renderActionZone,
};

export const Error: Story = {
  args: { ...homeStoryDefaults, phase: "error", isTransitioning: true },
  tags: ["chromatic"],
  render: renderActionZone,
};

export const Loading: Story = {
  args: { ...homeStoryDefaults, phase: "loading" },
  render: renderActionZone,
};

export const ConnectingMobile: Story = {
  args: { ...homeStoryDefaults, phase: "connecting", isTransitioning: true },
  parameters: mobileStoryParameters,
  render: renderActionZone,
};
