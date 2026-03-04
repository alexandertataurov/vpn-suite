import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Shared/Primitives/Checkbox",
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

export const CheckboxOverview: Story = {
  args: { label: "Accept terms" },
};

export const CheckboxVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <Checkbox label="Default" />
      <Checkbox label="Checked" defaultChecked />
    </div>
  ),
};

export const CheckboxSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; checkbox uses tokenized size.</p>
      <Checkbox label="Accept terms" />
    </div>
  ),
};

export const CheckboxStates: Story = {
  render: () => (
    <div className="sb-stack">
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Disabled" disabled />
    </div>
  ),
};

export const CheckboxWithLongText: Story = {
  args: { label: "I agree to the terms and confirm I understand the data retention policy" },
};

export const CheckboxAccessibility: Story = {
  args: { label: "Focus me with Tab" },
};

export const CheckboxDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { label: "Accept terms" },
};

export const CheckboxEdgeCases = WithLongText;
