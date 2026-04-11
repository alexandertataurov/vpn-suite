import type { Meta, StoryObj } from "@storybook/react";
import { ActionCard } from "@/design-system/patterns";
import { StorySection, StoryShowcase, StoryGrid } from "@/design-system";

const meta: Meta<typeof ActionCard> = {
  title: "Patterns/ActionCard",
  tags: ["autodocs"],
  component: ActionCard,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Action card for label/value pairs or title/description blocks. It becomes interactive when `onClick` is provided.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Devices",
    value: "2 / 5",
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Compact summary action for a single metric and an affordance.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <ActionCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  name: "Variants",
  render: () => (
    <StorySection title="Variants" description="Label/value and title/description layouts, plus the static variant.">
      <StoryShowcase>
        <StoryGrid>
          <ActionCard label="Devices" value="2 / 5" onClick={() => {}} />
          <ActionCard label="Valid Until" value="Apr 15" onClick={() => {}} />
          <ActionCard
            title="Plan"
            description="Pro Monthly · 5 devices"
            onClick={() => {}}
          />
          <ActionCard label="Region" value="Auto" />
        </StoryGrid>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Static: Story = {
  args: {
    label: "Region",
    value: "Auto",
  },
  render: (args) => (
    <StoryShowcase>
      <ActionCard {...args} />
    </StoryShowcase>
  ),
};
