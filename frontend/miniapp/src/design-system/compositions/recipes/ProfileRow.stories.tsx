import type { Meta, StoryObj } from "@storybook/react";
import { ProfileRow } from "./ProfileRow";
import { PillChip } from "../patterns";

const meta: Meta<typeof ProfileRow> = {
  title: "Patterns/ProfileRow",
  tags: ["autodocs"],
  component: ProfileRow,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Profile row: Avatar + name + PillChip + SettingsButton.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "Alex",
    status: <PillChip variant="active">PRO</PillChip>,
    onSettings: () => {},
  },
};

export const Expiring: Story = {
  args: {
    name: "Alex",
    status: <PillChip variant="expiring">Expiring · 14d</PillChip>,
    onSettings: () => {},
  },
};
