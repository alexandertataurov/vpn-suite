import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FOUNDATION,
  resolveToken,
} from "./foundationShared";

const meta: Meta = {
  title: "Foundations/Color",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Semantic color tokens. Use these in product code; avoid raw hex/RGB.",
      },
    },
  },
};
export default meta;

type ColorItem = { token: string; usage: string };

function ColorSwatch({ token, usage }: ColorItem) {
  const value = resolveToken(token);
  const isLight = token.includes("on-accent") || token.includes("overlay");

  return (
    <TokenSlot
      label={token.replace("--color-", "")}
      value={value}
      usage={usage}
    >
      <div
        title={value}
        style={{
          width: FOUNDATION.cardSize,
          height: FOUNDATION.cardSize,
          borderRadius: FOUNDATION.cardRadius,
          background: `var(${token})`,
          backgroundImage: isLight
            ? `linear-gradient(45deg, #ddd 25%, transparent 25%),
               linear-gradient(-45deg, #ddd 25%, transparent 25%),
               linear-gradient(45deg, transparent 75%, #ddd 75%),
               linear-gradient(-45deg, transparent 75%, #ddd 75%),
               var(${token})`
            : undefined,
          backgroundSize: isLight ? "8px 8px, 8px 8px, 8px 8px, 8px 8px, 100%" : undefined,
          backgroundPosition: isLight ? "0 0, 0 4px, 4px -4px, -4px 0px, 0 0" : undefined,
          border: FOUNDATION.cardBorder,
        }}
      />
    </TokenSlot>
  );
}

const COLOR_GROUPS: Record<string, ColorItem[]> = {
  Surfaces: [
    { token: "--color-bg", usage: "Page background" },
    { token: "--color-surface", usage: "Card, modal, panel" },
    { token: "--color-surface-2", usage: "Nested card, input bg" },
    { token: "--color-overlay", usage: "Scrim behind modals" },
  ],
  Text: [
    { token: "--color-text", usage: "Primary text" },
    { token: "--color-text-muted", usage: "Secondary, labels" },
    { token: "--color-text-tertiary", usage: "Placeholder, disabled" },
  ],
  Borders: [
    { token: "--color-border", usage: "Default border" },
    { token: "--color-border-subtle", usage: "Subtle divider" },
    { token: "--color-border-strong", usage: "Emphasis border" },
  ],
  Accent: [
    { token: "--color-accent", usage: "Primary action" },
    { token: "--color-accent-hover", usage: "Hover state" },
    { token: "--color-on-accent", usage: "Text on accent" },
  ],
  Semantic: [
    { token: "--color-success", usage: "Success, connected" },
    { token: "--color-warning", usage: "Warning state" },
    { token: "--color-error", usage: "Error, danger" },
    { token: "--color-info", usage: "Info, neutral" },
  ],
};

export const All: StoryObj = {
  name: "All tokens",
  render: () => (
    <FoundationSection>
      {Object.entries(COLOR_GROUPS).map(([name, items]) => (
        <div key={name}>
          <GroupLabel>{name}</GroupLabel>
          <TokenGrid>
            {items.map(({ token, usage }) => (
              <ColorSwatch key={token} token={token} usage={usage} />
            ))}
          </TokenGrid>
        </div>
      ))}
    </FoundationSection>
  ),
};
