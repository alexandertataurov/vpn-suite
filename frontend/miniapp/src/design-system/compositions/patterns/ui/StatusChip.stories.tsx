import type { Meta, StoryObj } from "@storybook/react";
import { StatusChip } from "./StatusChip";
import { StorySection, StoryShowcase, StoryGrid } from "@/design-system";

const meta = {
  title: "Components/StatusChip",
  tags: ["autodocs"],
  component: StatusChip,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Status chip for subscription/connection states. Variants: active, paid, info, pending, offline, blocked, warning, danger. Uses design tokens.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "active",
        "expiring",
        "expired",
        "paid",
        "info",
        "pending",
        "offline",
        "blocked",
        "warning",
        "danger",
      ],
    },
  },
} satisfies Meta<typeof StatusChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Active", variant: "active" },
  render: (args) => (
    <StoryShowcase>
      <StatusChip {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="All status variants.">
      <StoryShowcase>
        <StoryGrid>
          <StatusChip variant="active">Active</StatusChip>
          <StatusChip variant="expiring">Expiring</StatusChip>
          <StatusChip variant="expired">Expired</StatusChip>
          <StatusChip variant="paid">Paid</StatusChip>
          <StatusChip variant="info">Info</StatusChip>
          <StatusChip variant="pending">Pending</StatusChip>
          <StatusChip variant="offline">Offline</StatusChip>
          <StatusChip variant="blocked">Blocked</StatusChip>
          <StatusChip variant="warning">Warning</StatusChip>
          <StatusChip variant="danger">Danger</StatusChip>
        </StoryGrid>
      </StoryShowcase>
    </StorySection>
  ),
};

export const InContext: Story = {
  render: () => (
    <StorySection title="In context" description="Plan card and device row.">
      <StoryShowcase>
        <div className="story-stack">
          <div className="story-preview-card">
            <div className="story-stack story-stack--tight">
              <span className="story-section__title story-text-reset">Current plan</span>
              <StatusChip variant="active">Active</StatusChip>
            </div>
          </div>
          <div className="story-preview-card">
            <div className="story-stack story-stack--tight">
              <span className="story-section__title story-text-reset">Device</span>
              <StatusChip variant="info">iPhone</StatusChip>
            </div>
          </div>
        </div>
      </StoryShowcase>
    </StorySection>
  ),
};
