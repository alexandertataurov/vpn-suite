import type { Meta, StoryObj } from "@storybook/react";
import { SegmentedControl } from "@/design-system/patterns";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof SegmentedControl> = {
  title: "Patterns/SegmentedControl",
  tags: ["autodocs"],
  component: SegmentedControl,
  parameters: {
    status: { type: "deprecated" },
    layout: "padded",
    docs: {
      description: {
        component:
          "Legacy segmented control for content forms. Keep this only as a compatibility reference; new plan-selection flows should use `BillingPeriodToggle`.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const MONTHLY_ANNUAL = [
  { id: "monthly", label: "Monthly" },
  { id: "annual", label: "Annual", badge: { label: "Save 20%", variant: "positive" as const } },
];

export const Default: Story = {
  args: {
    options: MONTHLY_ANNUAL,
    activeId: "monthly",
    onSelect: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <SegmentedControl {...args} />
    </StoryShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Legacy two-option segmented control in its default state. Keep this only as a compatibility reference while billing flows move to `BillingPeriodToggle`.",
      },
    },
  },
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Selected and badge-enhanced states for the legacy control.">
      <StoryShowcase>
        <StoryStack>
          <SegmentedControl options={MONTHLY_ANNUAL} activeId="monthly" onSelect={() => {}} />
          <SegmentedControl options={MONTHLY_ANNUAL} activeId="annual" onSelect={() => {}} />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Selected and badge-enhanced states for the legacy control. This is the quickest way to spot whether the active option and badge treatment still render correctly.",
      },
    },
  },
};
