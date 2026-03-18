import type { Meta, StoryObj } from "@storybook/react";
import { ProfileRow } from "./ProfileRow";
import { StoryShowcase } from "@/design-system";

const meta: Meta<typeof ProfileRow> = {
  title: "Recipes/ProfileRow",
  tags: ["autodocs"],
  component: ProfileRow,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Home screen header. Single horizontal row — avatar, name, plan chip, settings button.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "Alex T.",
    initials: "AT",
    status: "active",
    planName: "PRO",
    onSettings: () => {},
  },
  render: (args) => (
    <StoryShowcase>
      <ProfileRow {...args} />
    </StoryShowcase>
  ),
};
