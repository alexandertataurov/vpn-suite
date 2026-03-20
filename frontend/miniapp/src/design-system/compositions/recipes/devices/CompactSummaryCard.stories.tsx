import type { Meta, StoryObj } from "@storybook/react";
import { CompactSummaryCard } from "./CompactSummaryCard";
import { Button } from "@/design-system";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof CompactSummaryCard> = {
  title: "Recipes/Devices/CompactSummaryCard",
  tags: ["autodocs"],
  component: CompactSummaryCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Compact summary card contract with eyebrow, title, stats, actions, and footer slots.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const DEFAULT_STATS = [
  { label: "Devices", value: "2 / 5" },
  { label: "Expires", value: "Apr 15" },
];

export const Default: Story = {
  args: {
    eyebrow: "Pro Monthly",
    title: "Current plan",
    subtitle: "AmneziaWG · 5 devices",
    stats: DEFAULT_STATS,
    actions: <Button variant="secondary" size="sm">Manage</Button>,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Primary plan summary card with device and renewal stats plus a secondary action.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <CompactSummaryCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection
      title="Variants"
      description="Minimal and fully populated summary card states."
    >
      <StoryShowcase>
        <StoryStack>
          <CompactSummaryCard
            title="Simple card"
            subtitle="No stats"
          />
          <CompactSummaryCard
            eyebrow="Pro"
            title="Full card"
            subtitle="With stats and actions"
            stats={DEFAULT_STATS}
            actions={<Button variant="secondary" size="sm">Action</Button>}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
