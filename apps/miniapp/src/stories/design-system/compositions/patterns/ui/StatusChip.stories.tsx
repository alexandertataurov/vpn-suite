import type { Meta, StoryObj } from "@storybook/react";
import { StatusChip } from "@/design-system/patterns";
import { StorySection, StoryShowcase, StoryGrid } from "@/design-system";

const meta = {
  title: "Patterns/StatusChip",
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
  parameters: {
    docs: {
      description: {
        story:
          "Default active status chip for subscriptions and connection states. Use it to confirm the baseline label weight and color before testing other variants.",
      },
    },
  },
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="All status variants for subscription and connection states.">
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
  parameters: {
    docs: {
      description: {
        story:
          "All status variants for subscription and connection states. This is the comparison matrix for semantic color, border treatment, and copy density.",
      },
    },
  },
};

export const InContext: Story = {
  render: () => (
    <StorySection title="In context" description="Status chip inside plan and device summary cards.">
      <StoryShowcase>
        <div className="story-stack">
          <div className="story-preview-card">
            <div className="story-stack story-stack--tight">
              <span className="story-card-title">Current plan</span>
              <StatusChip variant="active">Active</StatusChip>
            </div>
          </div>
          <div className="story-preview-card">
            <div className="story-stack story-stack--tight">
              <span className="story-card-title">Device</span>
              <StatusChip variant="info">iPhone</StatusChip>
            </div>
          </div>
        </div>
      </StoryShowcase>
    </StorySection>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Status chip placed inside plan and device summary cards. The goal is to verify that the chip stays readable when nested in a card title block.",
      },
    },
  },
};
