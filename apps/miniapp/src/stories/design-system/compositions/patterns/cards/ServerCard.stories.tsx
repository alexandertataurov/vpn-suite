import type { Meta, StoryObj } from "@storybook/react";
import { ServerCard } from "@/design-system/patterns";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof ServerCard> = {
  title: "Patterns/ServerCard",
  tags: ["autodocs"],
  component: ServerCard,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Server selection card with location, latency, load, and action state. Built on SelectionCard.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "United States",
    region: "US",
    avgPingMs: 45,
    loadPercent: 12,
    isCurrent: false,
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Default server card for a selectable destination.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <ServerCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Available, selected, and high-load states for server selection.">
      <StoryShowcase>
        <StoryStack>
          <ServerCard
            name="United States"
            region="US"
            avgPingMs={45}
            loadPercent={12}
            onSelect={() => {}}
          />
          <ServerCard
            name="Germany"
            region="EU"
            avgPingMs={89}
            loadPercent={34}
            isCurrent
            onSelect={() => {}}
          />
          <ServerCard
            name="Singapore"
            region="SG"
            avgPingMs={220}
            loadPercent={92}
            onSelect={() => {}}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
