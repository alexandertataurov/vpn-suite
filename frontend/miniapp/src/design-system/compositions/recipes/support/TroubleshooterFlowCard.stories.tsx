import type { Meta, StoryObj } from "@storybook/react";
import { TroubleshooterFlowCard } from "./TroubleshooterFlowCard";

const meta: Meta<typeof TroubleshooterFlowCard> = {
  title: "Recipes/Support/TroubleshooterFlowCard",
  component: TroubleshooterFlowCard,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof TroubleshooterFlowCard>;

export const Default: Story = {
  args: {
    eyebrow: "Troubleshooter",
    stepLabel: "Step 1/4",
    title: "Check access status",
    body: "Open Home or Plan. If there is no active plan, choose one before trying device setup.",
    altAction: { label: "No, choose plan", onClick: () => {} },
    nextAction: { label: "Access is active", onClick: () => {} },
  },
};

export const WithBack: Story = {
  args: {
    eyebrow: "Troubleshooter",
    stepLabel: "Step 2/4",
    title: "Check device setup",
    body: "Open Devices and verify your config is imported.",
    backAction: { label: "Back", onClick: () => {} },
    nextAction: { label: "Next", onClick: () => {} },
  },
};
