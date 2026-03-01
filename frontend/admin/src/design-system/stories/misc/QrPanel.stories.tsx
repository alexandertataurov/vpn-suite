import type { Meta, StoryObj } from "@storybook/react";
import { QrPanel } from "@/design-system";

const meta: Meta<typeof QrPanel> = {
  title: "Components/QrPanel",
  component: QrPanel,
  parameters: {
    docs: {
      description: {
        component: "QR code + copyable content. Use for device setup.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof QrPanel>;

export const Overview: Story = {
  args: { value: "https://example.com/config" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-row">
      <QrPanel value="https://example.com/config" />
      <QrPanel value="vpn://join?token=abcdef" copyLabel="Copy token" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-row">
      <p className="m-0">Size variants should use tokenized values; default size is recommended.</p>
      <QrPanel value="https://example.com/config" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <QrPanel value="https://example.com/config" />
  ),
};

export const WithLongText: Story = {
  args: { value: "https://example.com/config?token=very-long-token-value-0123456789-abcdefghijklmnopqrstuvwxyz" },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { value: "https://example.com/config" },
};

export const Accessibility: Story = {
  args: { value: "https://example.com/config" },
};

export const EdgeCases = WithLongText;
