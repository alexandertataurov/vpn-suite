import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./Avatar";
import { Inline } from "@/design-system/core/primitives";

const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  tags: ["autodocs"],
  component: Avatar,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "Profile avatar with gradient background and initials.",
      },
    },
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md"] },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { initials: "JD", size: "md" },
};

export const Sizes: Story = {
  render: () => (
    <Inline gap="2" align="center">
      <Avatar initials="AB" size="sm" />
      <Avatar initials="CD" size="md" />
    </Inline>
  ),
};
