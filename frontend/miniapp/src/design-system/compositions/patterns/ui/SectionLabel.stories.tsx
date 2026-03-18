import type { Meta, StoryObj } from "@storybook/react";
import { SectionLabel } from "./SectionLabel";

const meta: Meta<typeof SectionLabel> = {
  title: "Components/SectionLabel",
  tags: ["autodocs"],
  component: SectionLabel,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component: "Eyebrow label for section headers.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: "Section" },
};
