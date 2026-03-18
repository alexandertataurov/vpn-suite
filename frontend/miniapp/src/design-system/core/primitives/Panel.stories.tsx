import type { Meta, StoryObj } from "@storybook/react";
import { Panel, Stack } from "./index";

const meta: Meta<typeof Panel> = {
  title: "Primitives/Panel",
  component: Panel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Surface or outline panel. Use for cards, modals, or grouped content.",
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
    <Stack gap="4">
      <Panel variant="surface" padding="md">
        Surface panel (default) — background + subtle border
      </Panel>
      <Panel variant="outline" padding="md">
        Outline panel — border only
      </Panel>
    </Stack>
  ),
};

export const PaddingSizes: Story = {
  render: () => (
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
  ),
};
