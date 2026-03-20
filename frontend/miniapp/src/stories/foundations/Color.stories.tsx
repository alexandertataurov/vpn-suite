import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FoundationColorPreview,
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
          "Semantic color tokens for the miniapp theme. Use them for surfaces, text, borders, accent states, and semantic feedback instead of raw hex or RGB values.",
      },
    },
  },
};
export default meta;

type ColorItem = { token: string; usage: string };

function ColorSwatch({ token, usage }: ColorItem) {
  const value = resolveToken(token);

  return (
    <TokenSlot
      label={token.replace("--color-", "")}
      value={value}
      usage={usage}
    >
      <FoundationColorPreview token={token} />
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
  "Semantic Backgrounds": [
    { token: "--color-success-bg", usage: "Success background" },
    { token: "--color-success-border", usage: "Success border" },
    { token: "--color-warning-bg", usage: "Warning background" },
    { token: "--color-warning-border", usage: "Warning border" },
    { token: "--color-error-bg", usage: "Error background" },
    { token: "--color-error-border", usage: "Error border" },
    { token: "--color-info-bg", usage: "Info background" },
    { token: "--color-info-border", usage: "Info border" },
  ],
};

export const All: StoryObj = {
  name: "All tokens",
  parameters: {
    docs: {
      description: {
        story: "Grouped by surfaces, text, borders, accent, and semantic feedback.",
      },
    },
  },
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
