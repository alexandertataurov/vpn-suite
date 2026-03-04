import type { Meta, StoryObj } from "@storybook/react";
import { QrPanel } from "./QrPanel";

const meta: Meta<typeof QrPanel> = {
  title: "Shared/Components/QrPanel",
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

export const QrPanelOverview: Story = {
  args: { value: "https://example.com/config" },
};

export const QrPanelVariants: Story = {
  render: () => (
    <div className="sb-row">
      <QrPanel value="https://example.com/config" />
      <QrPanel value="vpn://join?token=abcdef" copyLabel="Copy token" />
    </div>
  ),
};

export const QrPanelSizes: Story = {
  render: () => (
    <div className="sb-row">
      <p className="m-0">Size variants should use tokenized values; default size is recommended.</p>
      <QrPanel value="https://example.com/config" />
    </div>
  ),
};

export const QrPanelStates: Story = {
  render: () => (
    <QrPanel value="https://example.com/config" />
  ),
};

export const QrPanelWithLongText: Story = {
  args: { value: "https://example.com/config?token=very-long-token-value-0123456789-abcdefghijklmnopqrstuvwxyz" },
};

export const QrPanelDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { value: "https://example.com/config" },
};

export const QrPanelAccessibility: Story = {
  args: { value: "https://example.com/config" },
};

export const QrPanelEdgeCases = WithLongText;
