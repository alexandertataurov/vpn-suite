import type { Meta, StoryObj } from "@storybook/react";
import { Button, InlineAlert } from "@/design-system";
import { IconCheckCircle } from "@/design-system/icons";
import {
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  FoundationColorPreview,
  resolveToken,
} from "./foundationShared";

// ---------------------------------------------------------------------------
// Types — exported so Color.mdx and other consumers can reuse without re-declaring
// ---------------------------------------------------------------------------

export type TokenMode = "semantic" | "primitives";

export interface ColorItem {
  token: string;
  usage: string;
}

// ---------------------------------------------------------------------------
// Token definitions
// Declared before any story so the reading order matches the reference order.
// ---------------------------------------------------------------------------

export const SEMANTIC_GROUPS: Record<string, ColorItem[]> = {
  Surfaces: [
    { token: "--color-bg",        usage: "Page background" },
    { token: "--color-surface",   usage: "Card, modal, panel" },
    { token: "--color-surface-2", usage: "Nested card, input bg" },
    { token: "--color-overlay",   usage: "Scrim behind modals" },
  ],
  Text: [
    { token: "--color-text",          usage: "Primary text" },
    { token: "--color-text-muted",    usage: "Secondary, labels" },
    { token: "--color-text-tertiary", usage: "Placeholder, disabled" },
  ],
  Borders: [
    { token: "--color-border",        usage: "Default border" },
    { token: "--color-border-subtle", usage: "Subtle divider" },
    { token: "--color-border-strong", usage: "Emphasis border" },
  ],
  Accent: [
    { token: "--color-accent",    usage: "Primary action" },
    { token: "--color-accent-hover", usage: "Hover state" },
    { token: "--color-on-accent", usage: "Text on accent" },
  ],
  Semantic: [
    { token: "--color-success", usage: "Success, connected" },
    { token: "--color-warning", usage: "Warning state" },
    { token: "--color-error",   usage: "Error, danger" },
    { token: "--color-info",    usage: "Info, neutral" },
  ],
  "Semantic Backgrounds": [
    { token: "--color-success-bg",     usage: "Success background" },
    { token: "--color-success-border", usage: "Success border" },
    { token: "--color-warning-bg",     usage: "Warning background" },
    { token: "--color-warning-border", usage: "Warning border" },
    { token: "--color-error-bg",       usage: "Error background" },
    { token: "--color-error-border",   usage: "Error border" },
    { token: "--color-info-bg",        usage: "Info background" },
    { token: "--color-info-border",    usage: "Info border" },
  ],
};

// Builds a ColorItem array from a palette prefix and a list of numeric steps.
function buildPaletteGroup(prefix: string, steps: readonly string[]): ColorItem[] {
  return steps.map((step) => ({
    token: `--color-${prefix}-${step}`,
    usage: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${step}`,
  }));
}

export const PRIMITIVE_GROUPS: Record<string, ColorItem[]> = {
  Gray:    buildPaletteGroup("gray",    ["50","100","200","300","400","500","600","700","800","900","950"]),
  Primary: buildPaletteGroup("primary", ["50","100","200","300","400","500","600","700","800","900","950"]),
  Success: buildPaletteGroup("success", ["50","100","200","300","400","500","600"]),
  Warning: buildPaletteGroup("warning", ["50","100","200","300","400","500","600"]),
  Error:   buildPaletteGroup("error",   ["50","100","200","300","400","500","600","700"]),
  Info:    buildPaletteGroup("info",    ["500","600"]),
};

const TOKEN_MODE_GROUPS: Record<TokenMode, Record<string, ColorItem[]>> = {
  semantic:   SEMANTIC_GROUPS,
  primitives: PRIMITIVE_GROUPS,
};

// All tokens available in the Playground selector, ordered by category.
const PLAYGROUND_TOKENS: string[] = [
  "--color-accent",
  "--color-surface",
  "--color-surface-2",
  "--color-bg",
  "--color-success",
  "--color-warning",
  "--color-error",
  "--color-primary-500",
  "--color-gray-950",
  "--color-success-500",
  "--color-warning-500",
  "--color-error-500",
];

// ---------------------------------------------------------------------------
// Internal components
// ---------------------------------------------------------------------------

function ColorSwatch({ token, usage }: ColorItem) {
  return (
    <TokenSlot
      label={token.replace("--color-", "")}
      value={resolveToken(token)}
      usage={usage}
    >
      <FoundationColorPreview token={token} />
    </TokenSlot>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: "Foundations/Color",
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Semantic color tokens for the miniapp theme — surfaces, text, borders, accent states, and semantic feedback. Never use raw hex or RGB values in components.",
      },
    },
  },
};

export default meta;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const All: StoryObj = {
  name: "Token gallery",
  parameters: {
    docs: {
      description: {
        story:
          "Full token inventory grouped by category. Use the **Tokens** toolbar control to switch between semantic tokens and underlying primitives.",
      },
    },
  },
  render: (_args, context) => {
    const rawMode = context.globals.tokenMode as string | undefined;
    const tokenMode: TokenMode = rawMode === "primitives" ? "primitives" : "semantic";
    const groups = TOKEN_MODE_GROUPS[tokenMode];

    return (
      <FoundationSection>
        {Object.entries(groups).map(([name, items]) => (
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
    );
  },
};

export const Showcase: StoryObj = {
  name: "Usage showcase",
  parameters: {
    docs: {
      description: {
        story: "Semantic tokens applied to real UI: inline alerts and primary actions.",
      },
    },
  },
  render: () => (
    <FoundationSection>
      <GroupLabel>Semantic usage</GroupLabel>
      <div className="story-stack">
        <InlineAlert
          variant="info"
          label="Token rule"
          message="Use semantic tokens so themes, contrast, and states stay consistent."
          iconMode="icon"
          compact
        />
        <div className="story-preview-card">
          <div className="story-stack story-stack--tight">
            <Button startIcon={<IconCheckCircle size={16} strokeWidth={2} />}>
              Proceed
            </Button>
            <div className="story-theme-rule-text">
              Accent and surface stay aligned across themes.
            </div>
          </div>
        </div>
      </div>
    </FoundationSection>
  ),
};

export const Playground: StoryObj<{ token: string }> = {
  name: "Playground",
  argTypes: {
    token: {
      control: "select",
      options: PLAYGROUND_TOKENS,
      description: "CSS custom property to preview",
    },
  },
  args: {
    token: "--color-accent",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Select any token to immediately see its resolved CSS value rendered in the preview.",
      },
    },
  },
  render: ({ token }) => (
    <FoundationSection>
      <GroupLabel>Resolved token</GroupLabel>
      <TokenSlot label={token.replace("--color-", "")} value={resolveToken(token)}>
        <FoundationColorPreview token={token} />
      </TokenSlot>
    </FoundationSection>
  ),
};