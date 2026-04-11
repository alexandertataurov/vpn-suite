import type { Meta, StoryObj } from "@storybook/react";
import { SelectionCard } from "@/design-system/patterns";
import { StatusChip } from "@/design-system/patterns";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof SelectionCard> = {
  title: "Patterns/SelectionCard",
  tags: ["autodocs"],
  component: SelectionCard,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Selectable card with title, subtitle, badge, metadata, and action button. Used by ServerCard.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Location US",
    subtitle: "United States",
    selected: false,
    onSelect: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Default unselected state for a selectable location card.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <SelectionCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Available and selected states with badges.">
      <StoryShowcase>
        <StoryStack>
          <SelectionCard
            title="Location US"
            subtitle="United States"
            badge={<StatusChip variant="info">Available</StatusChip>}
            onSelect={() => {}}
          />
          <SelectionCard
            title="Location EU"
            subtitle="Germany"
            badge={<StatusChip variant="active">Selected</StatusChip>}
            selected
            onSelect={() => {}}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const WithMetadata: Story = {
  render: () => (
    <StorySection title="With metadata" description="Metadata slot for latency, load, or other supporting values.">
      <StoryShowcase>
        <SelectionCard
          title="Location US"
          subtitle="United States"
          metadata={<div className="story-text-muted">Latency: 45 ms · Load: 12%</div>}
          onSelect={() => {}}
        />
      </StoryShowcase>
    </StorySection>
  ),
};
