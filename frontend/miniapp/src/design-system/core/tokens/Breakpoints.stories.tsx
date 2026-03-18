import type { Meta, StoryObj } from "@storybook/react";
import { BREAKPOINT_TOKENS } from "@/design-system/core/tokens";

const meta = {
  title: "Foundations/Breakpoints",
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "Responsive breakpoints. Use --breakpoint-*." } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const bpKeys = Object.keys(BREAKPOINT_TOKENS) as Array<keyof typeof BREAKPOINT_TOKENS>;

export const Tokens: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8, maxWidth: 320 }}>
      {bpKeys.map((key) => (
        <div
          key={key}
          style={{
            padding: "var(--spacing-3)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--typo-caption-size)",
          }}
        >
          {key}: <code>{`var(${BREAKPOINT_TOKENS[key]})`}</code>
        </div>
      ))}
    </div>
  ),
};
