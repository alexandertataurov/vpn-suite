import type { Meta, StoryObj } from "@storybook/react";
import { PageHeaderBadge } from "@/design-system/recipes";
import { StorySection, StoryShowcase, StoryGrid } from "@/design-system";

const meta: Meta<typeof PageHeaderBadge> = {
  title: "Recipes/Shared/PageHeaderBadge",
  tags: ["autodocs"],
  component: PageHeaderBadge,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Badge for page headers. Tones: neutral, info, success, warning, danger.",
      },
    },
  },
  argTypes: {
    tone: { control: "select", options: ["neutral", "info", "success", "warning", "danger"] },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Active",
    tone: "success",
  },
  parameters: {
    docs: {
      description: {
        story: "Positive status badge as used in page headers and summary rows.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <PageHeaderBadge {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="All tones plus the pulsing alert variant.">
      <StoryShowcase>
        <StoryGrid>
          <PageHeaderBadge label="Neutral" tone="neutral" />
          <PageHeaderBadge label="Info" tone="info" />
          <PageHeaderBadge label="Active" tone="success" />
          <PageHeaderBadge label="Expiring" tone="warning" />
          <PageHeaderBadge label="Expired" tone="danger" />
          <PageHeaderBadge label="Pulse" tone="warning" pulse />
        </StoryGrid>
      </StoryShowcase>
    </StorySection>
  ),
};
