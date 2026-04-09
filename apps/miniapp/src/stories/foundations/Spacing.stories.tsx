import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SPACING_TOKENS } from "@/design-system/core/tokens";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  resolveToken,
  FoundationBarPreview,
} from "./foundationShared";

const SPACING_ORDER: Array<keyof typeof SPACING_TOKENS> = [
  "1", "2", "3", "4", "5", "6", "8", "10", "12",
];

const meta: Meta = {
  title: "Foundations/Spacing",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Spacing scale for the 8px grid. Use `--spacing-*` and `--space-*` tokens so layout, padding, and gaps stay consistent across screens.",
      },
    },
  },
};
export default meta;

export const Scale: StoryObj = {
  name: "Scale",
  parameters: {
    docs: {
      description: {
        story: "Ascending spacing values for padding, gaps, and vertical rhythm.",
      },
    },
  },
  render: () => (
    <FoundationSection>
      <div>
        <GroupLabel>Spacing tokens (ascending)</GroupLabel>
        <TokenGrid>
          {SPACING_ORDER.map((key) => {
            const token = SPACING_TOKENS[key];
            const value = resolveToken(token);
            return (
              <TokenSlot key={key} label={token} value={value}>
                <SpacingSwatch token={token} />
              </TokenSlot>
            );
          })}
        </TokenGrid>
      </div>
    </FoundationSection>
  ),
};

function SpacingSwatch({ token }: { token: string }) {
  return <FoundationBarPreview token={token} />;
}

export const Showcase: StoryObj = {
  name: "Live spacing rhythm",
  parameters: {
    docs: {
      description: {
        story: "A presentation-ready sample layout showing padding + gaps using the spacing scale.",
      },
    },
  },
  render: () => (
    <FoundationSection>
      <GroupLabel>Rhythm preview</GroupLabel>
      <div className="story-preview-card">
        <div className="story-decorator">
          <div className="story-label">Section</div>
          <div className="story-checklist">
            <div className="story-theme-rule-text">
              Use `--spacing-*` tokens for consistent insets, gaps, and vertical rhythm.
            </div>
            <div className="story-theme-rule-text">
              Touch target spacing: at least 8px between interactive elements.
            </div>
          </div>
        </div>
      </div>
    </FoundationSection>
  ),
};

type SpacingKey = keyof typeof SPACING_TOKENS;
type DensityMode = "comfortable" | "compact";

function shiftKey(order: SpacingKey[], key: SpacingKey, delta: number): SpacingKey {
  const idx = order.indexOf(key);
  if (idx < 0) return key;
  const next = Math.max(0, Math.min(order.length - 1, idx + delta));
  return order[next];
}

export const Playground: StoryObj<{ gapKey: SpacingKey; paddingKey: SpacingKey }> = {
  name: "Interactive · spacing playground",
  argTypes: {
    gapKey: {
      control: "select",
      options: SPACING_ORDER,
    },
    paddingKey: {
      control: "select",
      options: SPACING_ORDER,
    },
  },
  args: { gapKey: "2", paddingKey: "4" },
  parameters: {
    docs: {
      description: {
        story: "Pick tokens for padding and gaps; optionally shift defaults when toolbar density is compact.",
      },
    },
  },
  render: ({ gapKey, paddingKey }, context) => {
    const density = (context.globals.density as DensityMode | undefined) ?? "comfortable";
    const effectiveGapKey = density === "compact" ? shiftKey(SPACING_ORDER, gapKey, -1) : gapKey;
    const effectivePaddingKey =
      density === "compact" ? shiftKey(SPACING_ORDER, paddingKey, -1) : paddingKey;

    const gapToken = SPACING_TOKENS[effectiveGapKey];
    const paddingToken = SPACING_TOKENS[effectivePaddingKey];

    const gapValue = resolveToken(gapToken);
    const paddingValue = resolveToken(paddingToken);

    return (
      <FoundationSection>
        <GroupLabel>Preview with resolved values</GroupLabel>
        <div className="story-preview-card">
          <div className="story-stack story-stack--tight" style={{ padding: paddingValue, gap: gapValue }}>
            <div className="story-label">Inset + rhythm</div>
            <div className="story-checklist">
              <div className="story-theme-rule-text">
                Gap uses <code>{gapToken}</code> → <code>{gapValue}</code>
              </div>
              <div className="story-theme-rule-text">
                Padding uses <code>{paddingToken}</code> → <code>{paddingValue}</code>
              </div>
            </div>
            <div className="story-preview-card">
              <div className="story-theme-rule-text">Content block</div>
            </div>
          </div>
        </div>
      </FoundationSection>
    );
  },
};
