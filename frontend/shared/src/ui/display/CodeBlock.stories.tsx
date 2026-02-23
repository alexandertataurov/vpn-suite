import type { Meta, StoryObj } from "@storybook/react";
import { CodeBlock } from "./CodeBlock";

const meta: Meta<typeof CodeBlock> = {
  title: "Components/CodeBlock",
  component: CodeBlock,
  parameters: {
    docs: {
      description: {
        component: "Code block with optional copy. Use for config, commands.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CodeBlock>;

export const Overview: Story = {
  args: { value: "[Server]\nport = 8080\nhost = 0.0.0.0", language: "ini" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <CodeBlock value="[Server]\nport = 8080" language="ini" />
      <CodeBlock value="export VPN_MODE=strict\nvpnctl status" language="conf" wrap={false} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; use maxHeight for scroll.</p>
      <CodeBlock value="[Server]\nport = 8080\nhost = 0.0.0.0" language="ini" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <CodeBlock value="vpnctl status" language="text" />
      <CodeBlock value={Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join("\n")} maxHeight={160} />
    </div>
  ),
};

export const WithLongText: Story = {
  args: { value: "very-long-token-value-without-breaks-0123456789abcdefghijklmnopqrstuvwxyz", wrap: false },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { value: "[Server]\nport = 8080\nhost = 0.0.0.0", language: "ini" },
};

export const Accessibility: Story = {
  args: { value: "vpnctl status", language: "text" },
};

export const EdgeCases = WithLongText;
