import type { Meta, StoryObj } from "@storybook/react";
import { SettingsButton } from "./SettingsButton";

const meta: Meta<typeof SettingsButton> = {
  title: "Components/SettingsButton",
  tags: ["autodocs"],
  component: SettingsButton,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "34×34 circular settings gear button for profile row.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { onClick: () => {} },
};
