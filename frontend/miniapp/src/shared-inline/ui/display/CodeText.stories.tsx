import type { Meta, StoryObj } from "@storybook/react";
import { CodeText } from "./CodeText";

const meta: Meta<typeof CodeText> = {
  title: "Components/CodeText",
  component: CodeText,
  parameters: {
    docs: {
      description: {
        component: "Inline code. Monospace, subtle background.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CodeText>;

export const Overview: Story = {
  args: { children: "vpnctl status" },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <CodeText>const x = 1</CodeText>
      <CodeText block>
        function hello() {"\n"} return {"'"}world{"'"};{"\n"}
      </CodeText>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses tokenized type.</p>
      <CodeText>vpnctl</CodeText>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <CodeText>vpnctl status</CodeText>
    </div>
  ),
};

export const WithLongText: Story = {
  args: { children: "very-long-config-id-0123456789-abcdefghijklmnopqrstuvwxyz" },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { children: "vpnctl status" },
};

export const Accessibility: Story = {
  args: { children: "Accessible code text" },
};

export const EdgeCases = WithLongText;
