import type { Meta, StoryObj } from "@storybook/react";
import { MOTION_TOKENS } from "@/design-system/core/tokens";

const meta = {
  title: "Foundations/Motion",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Duration and easing tokens. Use --duration-*, --ease-*.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const motionKeys = Object.keys(MOTION_TOKENS) as Array<keyof typeof MOTION_TOKENS>;

export const Tokens: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8, maxWidth: 320 }}>
      {motionKeys.map((key) => (
        <div
          key={key}
          style={{
            padding: "var(--spacing-3)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--typo-caption-size)",
            color: "var(--color-text)",
          }}
        >
          {key}: <code>{String(MOTION_TOKENS[key])}</code>
        </div>
      ))}
    </div>
  ),
};
