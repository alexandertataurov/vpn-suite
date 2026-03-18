import type { Meta, StoryObj } from "@storybook/react";
import { Panel, Stack } from "./index";

const meta = {
  title: "Primitives/Panel",
  tags: ["autodocs"],
  component: Panel,
  argTypes: {
    variant: { control: "select", options: ["surface", "outline"] },
    padding: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Panel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Panel content" },
};

export const Variants: Story = {
  render: () => (
    <Stack gap="4">
      <Panel variant="surface" padding="md">
        Surface panel (default)
      </Panel>
      <Panel variant="outline" padding="md">
        Outline panel
      </Panel>
    </Stack>
  ),
};

export const PaddingSizes: Story = {
  render: () => (
    <Stack gap="4">
      <Panel padding="sm">Small padding</Panel>
      <Panel padding="md">Medium padding (default)</Panel>
      <Panel padding="lg">Large padding</Panel>
    </Stack>
  ),
};
