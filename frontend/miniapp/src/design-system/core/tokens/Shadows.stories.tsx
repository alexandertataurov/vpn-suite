import type { Meta, StoryObj } from "@storybook/react";
import { SHADOW_TOKENS } from "@/design-system/core/tokens";

const meta = {
  title: "Foundations/Shadows",
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "Shadow tokens. Use --shadow-*." } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const shadowKeys = Object.keys(SHADOW_TOKENS) as Array<keyof typeof SHADOW_TOKENS>;

export const Scale: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      {shadowKeys.map((key) => (
        <div
          key={key}
          style={{
            width: 80,
            height: 80,
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface)",
            boxShadow: `var(${SHADOW_TOKENS[key]})`,
          }}
        />
      ))}
    </div>
  ),
};
