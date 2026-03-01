import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  parameters: {
    docs: {
      description: {
        component: "Checkbox with label. Use for boolean form options. Supports checked, disabled.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Overview: Story = {
  args: { label: "Accept terms" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <Checkbox label="Default" />
      <Checkbox label="Checked" defaultChecked />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; checkbox uses tokenized size.</p>
      <Checkbox label="Accept terms" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Disabled" disabled />
    </div>
  ),
};

export const WithLongText: Story = {
  args: { label: "I agree to the terms and confirm I understand the data retention policy" },
};

export const Accessibility: Story = {
  args: { label: "Focus me with Tab" },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { label: "Accept terms" },
};

export const EdgeCases = WithLongText;
