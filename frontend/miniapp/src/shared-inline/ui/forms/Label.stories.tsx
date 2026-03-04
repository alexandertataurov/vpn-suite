import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./Label";

const meta: Meta<typeof Label> = {
  title: "Shared/Primitives/Label",
  component: Label,
  parameters: {
    docs: {
      description: {
        component: "Form label. Use htmlFor to associate with control.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Label>;

export const LabelOverview: Story = { args: { children: "Field label" } };

export const LabelVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <Label>Default label</Label>
      <Label required>Required label</Label>
    </div>
  ),
};

export const LabelSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses label tokens.</p>
      <Label>Field label</Label>
    </div>
  ),
};

export const LabelStates: Story = {
  render: () => (
    <div className="sb-stack">
      <Label>Default label</Label>
      <Label required>Required label</Label>
    </div>
  ),
};

export const LabelWithLongText: Story = {
  args: { children: "Long label that should wrap across multiple lines without breaking layout" },
};

export const LabelAccessibility: Story = {
  args: { children: "Field label" },
};

export const LabelDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { children: "Field label" },
};

export const LabelEdgeCases = WithLongText;
