import type { Meta, StoryObj } from "@storybook/react";
import { LabeledControlRow } from "@/design-system/recipes";
import { Switch } from "@/design-system";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof LabeledControlRow> = {
  title: "Recipes/Settings/LabeledControlRow",
  tags: ["autodocs"],
  component: LabeledControlRow,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Label-plus-control row contract used across settings sections.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Notifications",
    children: <Switch checked={true} onChange={() => {}} />,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Canonical label and toggle pairing used for settings controls.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <LabeledControlRow {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Toggle and value-display control variants.">
      <StoryShowcase>
        <StoryStack>
          <LabeledControlRow label="Toggle">
            <Switch checked={true} onChange={() => {}} />
          </LabeledControlRow>
          <LabeledControlRow label="Value">
            <span className="story-text-muted">Pro</span>
          </LabeledControlRow>
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
