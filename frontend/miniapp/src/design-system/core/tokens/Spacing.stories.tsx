import type { Meta, StoryObj } from "@storybook/react";
import { SPACING_TOKENS } from "@/design-system/core/tokens";

const meta = {
  title: "Foundations/Spacing",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "8px grid. Use --spacing-* or --space-* tokens.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const spacingKeys = Object.keys(SPACING_TOKENS) as Array<keyof typeof SPACING_TOKENS>;

export const Scale: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {spacingKeys.map((key) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: `var(${SPACING_TOKENS[key]})`,
              height: 24,
              background: "var(--color-accent)",
              borderRadius: "var(--radius-sm)",
            }}
          />
          <code style={{ fontSize: "var(--typo-caption-size)", color: "var(--color-text-tertiary)" }}>
            {SPACING_TOKENS[key]}
          </code>
        </div>
      ))}
    </div>
  ),
};
