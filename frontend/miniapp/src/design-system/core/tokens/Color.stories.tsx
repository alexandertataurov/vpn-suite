import type { Meta, StoryObj } from "@storybook/react";
import { COLOR_TOKENS } from "@/design-system/core/tokens";
import { Stack } from "@/design-system/core/primitives";

const meta = {
  title: "Foundations/Colors",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Semantic color tokens. Use these in product code; avoid raw hex/RGB.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const semanticTokens = [
  [COLOR_TOKENS.bg, COLOR_TOKENS.surface, COLOR_TOKENS.surface2, COLOR_TOKENS.overlay],
  [COLOR_TOKENS.text, COLOR_TOKENS.textMuted, COLOR_TOKENS.textTertiary],
  [COLOR_TOKENS.border, COLOR_TOKENS.borderSubtle, COLOR_TOKENS.borderStrong],
  [COLOR_TOKENS.accent, COLOR_TOKENS.accentHover, COLOR_TOKENS.onAccent],
  [COLOR_TOKENS.success, COLOR_TOKENS.warning, COLOR_TOKENS.error, COLOR_TOKENS.info],
];

function Swatch({ token }: { token: string }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div
        style={{
          width: 64,
          height: 48,
          borderRadius: "var(--radius-md)",
          background: `var(${token})`,
          border: "1px solid var(--color-border-subtle)",
        }}
      />
      <code style={{ fontSize: "var(--typo-caption-size)", color: "var(--color-text-tertiary)" }}>
        {token.replace("--color-", "")}
      </code>
    </div>
  );
}

export const Semantic: Story = {
  render: () => (
    <Stack gap="4">
      {semanticTokens.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {row.map((token) => (
            <Swatch key={token} token={token} />
          ))}
        </div>
      ))}
    </Stack>
  ),
};
