import type { Meta, StoryObj } from "@storybook/react";
import { CodeText } from "./CodeText";

const meta: Meta<typeof CodeText> = {
  title: "Shared/Components/CodeText",
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

export const CodeTextOverview: Story = {
  args: { children: "vpnctl status" },
};

export const CodeTextVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <CodeText>const x = 1</CodeText>
      <CodeText block>
        function hello() {"\n"} return {"'"}world{"'"};{"\n"}
      </CodeText>
    </div>
  ),
};

export const CodeTextSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; uses tokenized type.</p>
      <CodeText>vpnctl</CodeText>
    </div>
  ),
};

export const CodeTextStates: Story = {
  render: () => (
    <div className="sb-stack">
      <CodeText>vpnctl status</CodeText>
    </div>
  ),
};

export const CodeTextWithLongText: Story = {
  args: { children: "very-long-config-id-0123456789-abcdefghijklmnopqrstuvwxyz" },
};

export const CodeTextDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { children: "vpnctl status" },
};

export const CodeTextAccessibility: Story = {
  args: { children: "Accessible code text" },
};

export const CodeTextEdgeCases = WithLongText;
