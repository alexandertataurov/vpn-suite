import type { Meta, StoryObj } from "@storybook/react";
import { PageHeader } from "./PageHeader";

const meta: Meta<typeof PageHeader> = {
  title: "Recipes/PageHeader",
  tags: ["autodocs"],
  component: PageHeader,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Page header for secondary pages (Settings, Plan, Restore Access, Support). Back button + title block + optional action.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Settings",
    subtitle: "Manage your account and preferences",
    onBack: () => {},
  },
};

export const TitleOnly: Story = {
  args: {
    title: "Plan",
    onBack: () => {},
  },
};
