import type { Meta, StoryObj } from "@storybook/react";
import { CompactStepper } from "@/design-system/recipes";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof CompactStepper> = {
  title: "Recipes/Flow/CompactStepper",
  tags: ["autodocs"],
  component: CompactStepper,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Compact stepper for onboarding and troubleshooting flows. States: complete, current, upcoming.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const STEPS = [
  { id: "1", label: "Check access", state: "complete" as const },
  { id: "2", label: "Verify device", description: "Current step", state: "current" as const },
  { id: "3", label: "Refresh config", state: "upcoming" as const },
];

export const Default: Story = {
  args: {
    items: STEPS,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Three-step progression with one current step and supporting description text. The active step is announced as `aria-current=\"step\"`.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <CompactStepper {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="All-complete vs default three-step flow.">
      <StoryShowcase>
        <CompactStepper
          items={[
            { id: "a1", label: "Step 1", state: "complete" },
            { id: "a2", label: "Step 2", state: "complete" },
            { id: "a3", label: "Step 3", state: "complete" },
          ]}
        />
        <CompactStepper
          items={[
            { id: "b1", label: "Check access", state: "complete" },
            { id: "b2", label: "Verify device", description: "In progress", state: "current" },
            { id: "b3", label: "Refresh config", state: "upcoming" },
          ]}
        />
      </StoryShowcase>
    </StorySection>
  ),
};
