import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "@/design-system";

const meta: Meta<typeof Label> = {
  title: "Primitives/Label",
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

export const Overview: Story = { args: { children: "Field label" } };

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <Label>Default label</Label>
      <Label required>Required label</Label>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses label tokens.</p>
      <Label>Field label</Label>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <Label>Default label</Label>
      <Label required>Required label</Label>
    </div>
  ),
};

export const WithLongText: Story = {
  args: { children: "Long label that should wrap across multiple lines without breaking layout" },
};

export const Accessibility: Story = {
  args: { children: "Field label" },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { children: "Field label" },
};

export const EdgeCases = WithLongText;
