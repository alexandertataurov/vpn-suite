import type { Meta, StoryObj } from "@storybook/react";
import { LabeledControlRow } from "./LabeledControlRow";
import { Switch } from "@/design-system";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof LabeledControlRow> = {
  title: "Recipes/LabeledControlRow",
  tags: ["autodocs"],
  component: LabeledControlRow,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Label + control row layout.",
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
  render: (args) => (
    <StoryShowcase>
      <LabeledControlRow {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="With different controls.">
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
