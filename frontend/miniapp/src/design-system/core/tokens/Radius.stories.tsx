import type { Meta, StoryObj } from "@storybook/react";
import { RADIUS_TOKENS } from "@/design-system/core/tokens";

const meta = {
  title: "Foundations/Radius",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Border radius tokens. Use --radius-*.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const radiusKeys = Object.keys(RADIUS_TOKENS) as Array<keyof typeof RADIUS_TOKENS>;

export const Scale: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {radiusKeys.map((key) => (
        <div key={key} style={{ display: "grid", gap: 8, alignItems: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: `var(${RADIUS_TOKENS[key]})`,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          />
          <code style={{ fontSize: "var(--typo-caption-size)", color: "var(--color-text-tertiary)" }}>
            {RADIUS_TOKENS[key]}
          </code>
        </div>
      ))}
    </div>
  ),
};
