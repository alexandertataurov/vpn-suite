import type { Meta, StoryObj } from "@storybook/react";
import { HomeQuickActionGrid } from "../patterns";
import {
  buildQuickActionProps,
  chromaticParameters,
  homeStoryDefaults,
  HomeStoryFrame,
  mobileStoryParameters,
  type HomeStoryArgs,
} from "./home.story-helpers";

const meta = {
  title: "Patterns/Home/HomeQuickActionGrid",
  component: HomeQuickActionGrid,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "HomeQuickActionGrid exposes the canonical secondary-task set for the home screen. Cards stay visible even when unavailable, using disabled reasons instead of disappearing from the layout.",
      },
    },
    ...chromaticParameters,
  },
} satisfies Meta<HomeStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

function renderQuickActions(args: HomeStoryArgs, disabledActions?: Parameters<typeof buildQuickActionProps>[1]["disabledActions"]) {
  return (
    <HomeStoryFrame>
      <HomeQuickActionGrid {...buildQuickActionProps(args, { disabledActions })} />
    </HomeStoryFrame>
  );
}

export const AllEnabled: Story = {
  args: { ...homeStoryDefaults, phase: "connected", deviceCount: 2, planLimit: 5 },
  tags: ["chromatic"],
  render: (args) => renderQuickActions(args),
};

export const PartialDisabled: Story = {
  args: { ...homeStoryDefaults, phase: "disconnected", deviceCount: 5, planLimit: 5 },
  render: (args) =>
    renderQuickActions(args, {
      add_device: "Unavailable - plan limit reached",
      change_server: "Unavailable - not connected",
    }),
};

export const AllDisabled: Story = {
  args: { ...homeStoryDefaults, phase: "disconnected", deviceCount: 5, planLimit: 5 },
  tags: ["chromatic-release"],
  render: (args) =>
    renderQuickActions(args, {
      add_device: "Unavailable - plan limit reached",
      change_server: "Unavailable - not connected",
      download_config: "Unavailable - profile still loading",
      refer_friend: "Unavailable - referral service paused",
      view_usage: "Unavailable - usage service offline",
    }),
};

export const PartialDisabledMobile: Story = {
  args: { ...homeStoryDefaults, phase: "disconnected", deviceCount: 5, planLimit: 5 },
  parameters: mobileStoryParameters,
  render: (args) =>
    renderQuickActions(args, {
      add_device: "Unavailable - plan limit reached",
      change_server: "Unavailable - not connected",
    }),
};
