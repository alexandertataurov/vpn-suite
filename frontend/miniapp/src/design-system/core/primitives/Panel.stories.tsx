import type { Meta, StoryObj } from "@storybook/react";
import { Panel, Stack } from "./index";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof Panel> = {
  title: "Primitives/Panel",
  component: Panel,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Surface and outline panels for grouped content, cards, and dialog sections. Use panel variants instead of ad hoc borders and backgrounds.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["surface", "outline"] },
    padding: { control: "select", options: ["sm", "md", "lg"] },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Panel content",
    variant: "surface",
    padding: "md",
  },
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Surface panels are for default elevation; outline panels are for lighter grouping.">
      <StoryShowcase>
        <Stack gap="4">
          <Panel variant="surface" padding="md">
            Surface panel (default) — background + subtle border
          </Panel>
          <Panel variant="outline" padding="md">
            Outline panel — border only
          </Panel>
        </Stack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const PaddingSizes: Story = {
  render: () => (
    <StorySection title="Padding sizes" description="Spacing tokens keep panel density readable on mobile.">
      <StoryShowcase>
        <Stack gap="4">
          <Panel variant="surface" padding="sm">
            Small padding
          </Panel>
          <Panel variant="surface" padding="md">
            Medium padding (default)
          </Panel>
          <Panel variant="surface" padding="lg">
            Large padding
          </Panel>
        </Stack>
      </StoryShowcase>
    </StorySection>
  ),
};
