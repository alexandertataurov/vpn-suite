import type { Meta, StoryObj } from "@storybook/react";
import { getStoryRootDataAttributes } from "@/storybook/globals";
import {
  FoundationColorPreview,
  FoundationGrid,
  FoundationGroup,
  FoundationIntro,
  FoundationPanel,
  FoundationSection,
  GroupLabel,
  TokenGrid,
  TokenSlot,
  resolveToken,
} from "../shared/foundationShared";

export type TokenMode = "semantic" | "primitives";

type ColorItem = {
  token: string;
  usage: string;
};

function buildPaletteGroup(prefix: string, steps: readonly string[]): ColorItem[] {
  return steps.map((step) => ({
    token: `--color-${prefix}-${step}`,
    usage: `${prefix} ${step}`,
  }));
}

const SEMANTIC_GROUPS: Record<string, ColorItem[]> = {
  Surfaces: [
    { token: "--color-bg", usage: "Page background" },
    { token: "--color-surface", usage: "Primary panel" },
    { token: "--color-surface-2", usage: "Nested panel" },
    { token: "--color-overlay", usage: "Overlay" },
  ],
  Text: [
    { token: "--color-text", usage: "Primary text" },
    { token: "--color-text-muted", usage: "Secondary text" },
    { token: "--color-text-tertiary", usage: "Meta text" },
  ],
  Borders: [
    { token: "--color-border", usage: "Default border" },
    { token: "--color-border-subtle", usage: "Subtle border" },
    { token: "--color-border-strong", usage: "Strong border" },
  ],
  Accent: [
    { token: "--color-accent", usage: "Primary action" },
    { token: "--color-accent-hover", usage: "Action hover" },
    { token: "--color-on-accent", usage: "Text on accent" },
  ],
  Feedback: [
    { token: "--color-success", usage: "Success foreground" },
    { token: "--color-warning", usage: "Warning foreground" },
    { token: "--color-error", usage: "Error foreground" },
    { token: "--color-info", usage: "Info foreground" },
  ],
};

const PRIMITIVE_GROUPS: Record<string, ColorItem[]> = {
  Gray: buildPaletteGroup("gray", ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]),
  Primary: buildPaletteGroup("primary", ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]),
  Success: buildPaletteGroup("success", ["50", "100", "200", "300", "400", "500", "600"]),
  Warning: buildPaletteGroup("warning", ["50", "100", "200", "300", "400", "500", "600"]),
  Error: buildPaletteGroup("error", ["50", "100", "200", "300", "400", "500", "600", "700"]),
  Info: buildPaletteGroup("info", ["500", "600"]),
};

const TOKEN_MODE_GROUPS: Record<TokenMode, Record<string, ColorItem[]>> = {
  semantic: SEMANTIC_GROUPS,
  primitives: PRIMITIVE_GROUPS,
};

const PLAYGROUND_TOKENS = [
  "--color-accent",
  "--color-on-accent",
  "--color-bg",
  "--color-surface",
  "--color-text",
  "--color-border",
  "--color-success",
  "--color-warning",
  "--color-error",
  "--color-info",
] as const;

const THEME_OPTIONS = [
  { value: "consumer-light", label: "Light" },
  { value: "consumer-dark", label: "Dark" },
] as const;

type ConsumerTheme = (typeof THEME_OPTIONS)[number]["value"];

const THEME_TOKEN_VALUES: Record<ConsumerTheme, Record<string, string>> = {
  "consumer-light": {
    "--color-bg": "#F7F8FB",
    "--color-surface": "#FFFFFF",
    "--color-surface-2": "#F3F5F8",
    "--color-text": "#0F172A",
    "--color-text-muted": "#6B7280",
    "--color-border": "#E6E8EC",
    "--color-accent": "#2563EB",
    "--color-on-accent": "#FFFFFF",
    "--color-success": "#22C55E",
    "--color-warning": "#F59E0B",
    "--color-error": "#EF4444",
  },
  "consumer-dark": {
    "--color-bg": "#0F1419",
    "--color-surface": "#1A1F26",
    "--color-surface-2": "#252B33",
    "--color-text": "#E6EDF3",
    "--color-text-muted": "#8B949E",
    "--color-border": "#30363D",
    "--color-accent": "#58A6FF",
    "--color-on-accent": "#0F1419",
    "--color-success": "#3FB950",
    "--color-warning": "#D29922",
    "--color-error": "#F85149",
  },
};

function parseHexColor(input: string): [number, number, number] | null {
  const match = input.trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  return [
    Number.parseInt(match[1].slice(0, 2), 16),
    Number.parseInt(match[1].slice(2, 4), 16),
    Number.parseInt(match[1].slice(4, 6), 16),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]) {
  const channels = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string): number | null {
  const fg = parseHexColor(foreground);
  const bg = parseHexColor(background);
  if (!fg || !bg) return null;
  const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg));
  const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

const meta: Meta = {
  title: "Foundations/Color",
  includeStories: [
    "All",
    "ThemeComparison",
    "Showcase",
    "StateSemantics",
    "SemanticRoles",
    "ContrastAudit",
    "Playground",
  ],
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    toolbar: {
      tokenMode: { hidden: false },
    },
  },
};

export default meta;

function ColorSwatch({ token, usage }: ColorItem) {
  return (
    <TokenSlot label={token.replace("--color-", "")} value={resolveToken(token)} usage={usage}>
      <FoundationColorPreview token={token} />
    </TokenSlot>
  );
}

export const All: StoryObj = {
  name: "Token gallery",
  render: (_args, context) => {
    const mode: TokenMode = context.globals.tokenMode === "primitives" ? "primitives" : "semantic";
    const groups = TOKEN_MODE_GROUPS[mode];

    return (
      <div {...getStoryRootDataAttributes(context, { includeTokenMode: true })}>
        <FoundationSection>
          <FoundationIntro
            title="Color Tokens"
            description="One restrained palette system for structure, text hierarchy, action emphasis, and state meaning."
          />
          {Object.entries(groups).map(([name, items]) => (
            <FoundationGroup key={name}>
              <GroupLabel>{name}</GroupLabel>
              <TokenGrid>
                {items.map((item) => (
                  <ColorSwatch key={item.token} {...item} />
                ))}
              </TokenGrid>
            </FoundationGroup>
          ))}
        </FoundationSection>
      </div>
    );
  },
};

export const ThemeComparison: StoryObj = {
  name: "Theme comparison",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Light And Dark Baselines"
        description="Semantic roles stay stable across themes while values adapt for contrast and readability."
      />
      <FoundationGrid minColumn={320}>
        {THEME_OPTIONS.map(({ value, label }) => (
          <FoundationPanel
            key={value}
            style={{
              background: THEME_TOKEN_VALUES[value]["--color-bg"],
              color: THEME_TOKEN_VALUES[value]["--color-text"],
              borderColor: THEME_TOKEN_VALUES[value]["--color-border"],
            }}
          >
            <GroupLabel>{label}</GroupLabel>
            <div style={{ display: "grid", gap: "var(--spacing-2)" }}>
              {["--color-surface", "--color-accent", "--color-success", "--color-warning", "--color-error"].map((token) => (
                <div key={token} style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${THEME_TOKEN_VALUES[value]["--color-border"]}`,
                      background: THEME_TOKEN_VALUES[value][token],
                    }}
                  />
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--typo-meta-size)" }}>
                    {token.replace("--color-", "")}
                  </code>
                </div>
              ))}
            </div>
          </FoundationPanel>
        ))}
      </FoundationGrid>
    </FoundationSection>
  ),
};

export const Showcase: StoryObj = {
  name: "Usage showcase",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Applied Color Hierarchy"
        description="Color stays quiet by default and becomes louder only for primary action and meaningful status."
      />
      <FoundationPanel style={{ maxWidth: "34rem" }}>
        <div style={{ display: "grid", gap: "var(--spacing-1)" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Connection status</p>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            Surface and text tokens establish structure before accent and semantic colors appear.
          </p>
        </div>
        <div
          style={{
            border: "1px solid var(--color-success)",
            background: "var(--color-success-bg)",
            color: "var(--color-success)",
            borderRadius: "var(--radius-surface)",
            padding: "var(--spacing-3)",
            fontWeight: 600,
          }}
        >
          Protected tunnel active
        </div>
        <button
          type="button"
          style={{
            border: 0,
            borderRadius: "var(--radius-button)",
            background: "var(--color-accent)",
            color: "var(--color-on-accent)",
            padding: "10px 14px",
            fontWeight: 600,
            width: "fit-content",
          }}
        >
          Continue
        </button>
      </FoundationPanel>
    </FoundationSection>
  ),
};

export const StateSemantics: StoryObj = {
  name: "State semantics",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="State Color Mapping"
        description="Each semantic color maps to one state category and is paired with text for clarity."
      />
      <FoundationGrid>
        {[
          ["Success", "--color-success", "Completed or healthy state"],
          ["Warning", "--color-warning", "Needs attention soon"],
          ["Error", "--color-error", "Failed or blocked state"],
          ["Info", "--color-info", "Neutral guidance"],
        ].map(([title, token, body]) => (
          <FoundationPanel key={title}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "var(--radius-full)",
                  background: `var(${token})`,
                }}
              />
              <p style={{ margin: 0, fontWeight: 600 }}>{title}</p>
            </div>
            <p style={{ margin: 0, color: "var(--color-text-muted)" }}>{body}</p>
          </FoundationPanel>
        ))}
      </FoundationGrid>
    </FoundationSection>
  ),
};

export const SemanticRoles: StoryObj = {
  name: "Semantic roles",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Role Separation"
        description="Structure, content, action, and feedback remain visually distinct and predictable."
      />
      <FoundationGrid>
        <FoundationPanel>
          <GroupLabel>Structure</GroupLabel>
          <p style={{ margin: 0 }}>Use `--color-bg`, `--color-surface`, and border tokens for layout scaffolding.</p>
        </FoundationPanel>
        <FoundationPanel>
          <GroupLabel>Content</GroupLabel>
          <p style={{ margin: 0 }}>Use text roles for hierarchy before introducing accent or semantic colors.</p>
        </FoundationPanel>
        <FoundationPanel>
          <GroupLabel>Action</GroupLabel>
          <p style={{ margin: 0 }}>Reserve `--color-accent` for the single primary decision in a region.</p>
        </FoundationPanel>
        <FoundationPanel>
          <GroupLabel>Feedback</GroupLabel>
          <p style={{ margin: 0 }}>Use success, warning, error, and info only when state meaning changes.</p>
        </FoundationPanel>
      </FoundationGrid>
    </FoundationSection>
  ),
};

export const ContrastAudit: StoryObj = {
  name: "Contrast audit",
  render: () => (
    <FoundationSection>
      <FoundationIntro
        title="Contrast Baseline"
        description="AA contrast checks on core text and action pairs for both themes."
      />
      <FoundationGrid minColumn={320}>
        {THEME_OPTIONS.map(({ value, label }) => {
          const textOnBg = contrastRatio(
            THEME_TOKEN_VALUES[value]["--color-text"],
            THEME_TOKEN_VALUES[value]["--color-bg"],
          );
          const textOnAccent = contrastRatio(
            THEME_TOKEN_VALUES[value]["--color-on-accent"],
            THEME_TOKEN_VALUES[value]["--color-accent"],
          );

          return (
            <FoundationPanel key={value}>
              <GroupLabel>{label}</GroupLabel>
              <p style={{ margin: 0 }}>
                Text on background: <strong>{textOnBg?.toFixed(2) ?? "-"}:1</strong>
              </p>
              <p style={{ margin: 0 }}>
                Text on accent: <strong>{textOnAccent?.toFixed(2) ?? "-"}:1</strong>
              </p>
              <p style={{ margin: 0, color: "var(--color-text-muted)" }}>Target: 4.5:1 for body copy.</p>
            </FoundationPanel>
          );
        })}
      </FoundationGrid>
    </FoundationSection>
  ),
};

export const Playground: StoryObj<{ token: string }> = {
  name: "Playground",
  argTypes: {
    token: {
      control: "select",
      options: PLAYGROUND_TOKENS,
      description: "Token to preview",
    },
  },
  args: {
    token: PLAYGROUND_TOKENS[0],
  },
  render: ({ token }) => (
    <FoundationSection>
      <FoundationIntro
        title="Token Preview"
        description="Stateless token preview with resolved value and usage snippet."
      />
      <FoundationPanel>
        <div style={{ display: "grid", gap: "var(--spacing-3)", gridTemplateColumns: "7rem 1fr", alignItems: "start" }}>
          <FoundationColorPreview token={token} />
          <TokenSlot
            label={token.replace("--color-", "")}
            value={resolveToken(token)}
            usage="Use semantic color tokens in product code."
            copyable
            width="100%"
          >
            <div style={{ minHeight: 0 }} />
          </TokenSlot>
        </div>
      </FoundationPanel>
    </FoundationSection>
  ),
};
