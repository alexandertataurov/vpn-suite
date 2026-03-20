import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";
import { IconChevronRight } from "@/design-system/icons";
import { Inline } from "@/design-system/core/primitives";
import { StorySection, StoryShowcase } from "@/design-system";

const meta = {
  title: "Patterns/Badge",
  tags: ["autodocs"],
  component: Badge,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Inline badge for compact status indicators such as plan age, capacity, or renewals. Keep labels short and actionable.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["warning", "error", "muted", "success"] },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: "7d left", variant: "warning" },
  render: (args) => (
    <StoryShowcase>
      <Badge {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Warning, error, muted, and success states shown in one row.">
      <StoryShowcase>
        <Inline gap="2" wrap>
          <Badge label="7d left" variant="warning" />
          <Badge label="Renew" variant="error" />
          <Badge label="Full" variant="muted" />
          <Badge label="Active" variant="success" />
        </Inline>
      </StoryShowcase>
    </StorySection>
  ),
};

export const InContext: Story = {
  render: () => (
    <StorySection title="In context" description="Inline badge alongside a settings row label and chevron.">
      <StoryShowcase>
        <Inline gap="2" wrap align="center">
          <span className="story-label">Manage Devices</span>
          <Badge label="Full" variant="muted" />
          <IconChevronRight size={13} strokeWidth={2.5} aria-hidden />
        </Inline>
      </StoryShowcase>
    </StorySection>
  ),
};
