import type { Meta, StoryObj } from "@storybook/react";
import { CopyButton } from "./CopyButton";

const meta: Meta<typeof CopyButton> = {
  title: "Components/CopyButton",
  component: CopyButton,
  parameters: {
    docs: {
      description: {
        component: "Button that copies text to clipboard. Shows toast on success. Use aria-label for icon-only.",
      },
    },
  },
  argTypes: {
    value: { control: "text", description: "Text to copy to clipboard" },
    label: { control: "text", description: "Accessible label" },
    copiedMessage: { control: "text", description: "Toast message on copy" },
  },
};

export default meta;

type Story = StoryObj<typeof CopyButton>;

export const Overview: Story = {
  args: { value: "text to copy" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-row">
      <CopyButton value="config-value-xyz" label="Copy config" />
      <CopyButton value="token-abc" label="Copy token" copiedMessage="Copied token" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses button defaults.</p>
      <CopyButton value="config-value-xyz" label="Copy config" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-row">
      <CopyButton value="config-value-xyz" label="Copy" />
    </div>
  ),
};

export const WithLongText: Story = {
  args: { value: "very-long-config-id-0123456789-abcdefghijklmnopqrstuvwxyz", label: "Copy config id" },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { value: "config-value-xyz", label: "Copy config" },
};

export const Accessibility: Story = {
  args: { value: "config-value-xyz", label: "Copy config" },
};

export const EdgeCases = WithLongText;
