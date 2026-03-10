import type { Meta, StoryObj } from "@storybook/react";
import { COLOR_TOKENS } from "../tokens";
import {
  BoxPreview,
  StoryCard,
  StoryPage,
  StorySection,
  ThreeColumn,
  TokenTable,
  TwoColumn,
  UsageExample,
  ValuePill,
} from "./foundations.story-helpers";

const meta = {
  title: "Design System/Foundations/Color",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "Semantic color tokens used across the miniapp shell, components, and content-library patterns.",
          "",
          "## Coverage",
          "Includes the full exported color token set plus raw palette ramps that support the consumer theme.",
          "",
          "## Usage",
          "Use semantic tokens in product code. Palette ramps and tinted utility surfaces are for theme composition and system patterns.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const colorSpecs = [
  { name: "Background", token: COLOR_TOKENS.bg, usage: "App canvas and page background.", preview: <Swatch token={COLOR_TOKENS.bg} /> },
  { name: "Surface", token: COLOR_TOKENS.surface, usage: "Cards, sheets, and primary content containers.", preview: <Swatch token={COLOR_TOKENS.surface} /> },
  { name: "Surface 2", token: COLOR_TOKENS.surface2, usage: "Nested cards and secondary panels.", preview: <Swatch token={COLOR_TOKENS.surface2} /> },
  { name: "Overlay", token: COLOR_TOKENS.overlay, usage: "Modal scrim and floating layer backdrops.", preview: <Swatch token={COLOR_TOKENS.overlay} /> },
  { name: "Text", token: COLOR_TOKENS.text, usage: "Primary readable text.", preview: <Swatch token={COLOR_TOKENS.text} /> },
  { name: "Text Muted", token: COLOR_TOKENS.textMuted, usage: "Support copy and secondary metadata.", preview: <Swatch token={COLOR_TOKENS.textMuted} /> },
  { name: "Text Tertiary", token: COLOR_TOKENS.textTertiary, usage: "Hints, placeholders, inactive labels.", preview: <Swatch token={COLOR_TOKENS.textTertiary} /> },
  { name: "Text Inverse", token: COLOR_TOKENS.textInverse, usage: "Text rendered on inverted or tinted surfaces.", preview: <Swatch token={COLOR_TOKENS.textInverse} borderToken="--color-border-strong" /> },
  { name: "Border", token: COLOR_TOKENS.border, usage: "Default card and field outlines.", preview: <LinePreview token={COLOR_TOKENS.border} /> },
  { name: "Border Subtle", token: COLOR_TOKENS.borderSubtle, usage: "Quiet separators and low-emphasis dividers.", preview: <LinePreview token={COLOR_TOKENS.borderSubtle} /> },
  { name: "Border Strong", token: COLOR_TOKENS.borderStrong, usage: "Higher-contrast edges and focus-adjacent outlines.", preview: <LinePreview token={COLOR_TOKENS.borderStrong} /> },
  { name: "Accent", token: COLOR_TOKENS.accent, usage: "Primary interactive color and CTA fill.", preview: <Swatch token={COLOR_TOKENS.accent} /> },
  { name: "Accent Hover", token: COLOR_TOKENS.accentHover, usage: "Interactive hover state.", preview: <Swatch token={COLOR_TOKENS.accentHover} /> },
  { name: "Accent Active", token: COLOR_TOKENS.accentActive, usage: "Pressed or selected state.", preview: <Swatch token={COLOR_TOKENS.accentActive} /> },
  { name: "On Accent", token: COLOR_TOKENS.onAccent, usage: "Text and icon color inside accent-filled controls.", preview: <Swatch token={COLOR_TOKENS.onAccent} borderToken="--color-border-strong" /> },
  { name: "Focus Ring", token: COLOR_TOKENS.focusRing, usage: "Accessible focus indicator.", preview: <FocusPreview /> },
  { name: "Success", token: COLOR_TOKENS.success, usage: "Connected, healthy, verified states.", preview: <Swatch token={COLOR_TOKENS.success} /> },
  { name: "Warning", token: COLOR_TOKENS.warning, usage: "Expiring or degraded states.", preview: <Swatch token={COLOR_TOKENS.warning} /> },
  { name: "Error", token: COLOR_TOKENS.error, usage: "Blocking, destructive, or failed states.", preview: <Swatch token={COLOR_TOKENS.error} /> },
  { name: "Info", token: COLOR_TOKENS.info, usage: "Neutral guidance and informative emphasis.", preview: <Swatch token={COLOR_TOKENS.info} /> },
];

export const Reference: Story = {
  render: () => (
    <StoryPage
      eyebrow="Foundations"
      title="Color system"
      summary="A semantic color layer for the miniapp shell, content surfaces, interaction states, and operational feedback. This page documents every exported color token and shows how it translates into real miniapp UI."
      stats={[
        { label: "Semantic tokens", value: String(colorSpecs.length) },
        { label: "Palette ramps", value: "5" },
        { label: "In-context examples", value: "3" },
      ]}
    >
      <StorySection
        title="Semantic token reference"
        description="Use these semantic variables in components and page recipes. Each token below maps directly to the exported foundation contract."
      >
        <TokenTable specs={colorSpecs} />
      </StorySection>

      <StorySection
        title="Palette building blocks"
        description="Raw ramps and tinted surfaces support the consumer theme, badge fills, and system accents. Product code should still prefer the semantic layer above."
      >
        <TwoColumn>
          <StoryCard title="Neutral ramp" caption="Gray primitives behind shell layers and text hierarchy.">
            <Ramp
              items={[
                "--color-gray-50",
                "--color-gray-100",
                "--color-gray-200",
                "--color-gray-300",
                "--color-gray-400",
                "--color-gray-500",
                "--color-gray-600",
                "--color-gray-700",
                "--color-gray-800",
                "--color-gray-900",
                "--color-gray-950",
              ]}
            />
          </StoryCard>
          <StoryCard title="Status ramps" caption="Primary, success, warning, and error ramps used to derive interaction and feedback colors.">
            <ThreeColumn>
              <PaletteColumn
                title="Primary"
                items={["--color-primary-100", "--color-primary-300", "--color-primary-500", "--color-primary-700", "--color-primary-900"]}
              />
              <PaletteColumn
                title="Success"
                items={["--color-success-100", "--color-success-300", "--color-success-500", "--color-success-600"]}
              />
              <PaletteColumn
                title="Warning"
                items={["--color-warning-100", "--color-warning-300", "--color-warning-500", "--color-warning-600"]}
              />
            </ThreeColumn>
            <div style={{ marginTop: "var(--spacing-4)" }}>
              <PaletteColumn
                title="Error"
                items={["--color-error-100", "--color-error-300", "--color-error-500", "--color-error-700"]}
              />
            </div>
          </StoryCard>
        </TwoColumn>
      </StorySection>

      <StorySection
        title="Miniapp use cases"
        description="Foundations are only useful if they clarify product decisions. These examples mirror the miniapp's actual information density and state signaling."
      >
        <ThreeColumn>
          <UsageExample title="Connection status" description="Success and muted text tokens carry primary state without over-highlighting every row.">
            <div style={statusCardStyle}>
              <div style={statusTitleRowStyle}>
                <div>
                  <div style={metricLabelStyle}>Tunnel</div>
                  <div style={metricValueStyle}>Amsterdam, NL</div>
                </div>
                <ValuePill value="Connected" tone="success" />
              </div>
              <div style={statusMetaRowStyle}>
                <Metric label="Latency" value="127 ms" tone="success" />
                <Metric label="Protocol" value="AmneziaWG" />
              </div>
            </div>
          </UsageExample>

          <UsageExample title="Subscription attention" description="Warning and tertiary text create urgency without collapsing into error styling.">
            <div style={alertCardStyle}>
              <div style={alertHeadlineStyle}>Subscription renews in 3 days</div>
              <div style={alertBodyStyle}>Prompt the user to update payment before service degrades.</div>
              <div style={pillRowStyle}>
                <ValuePill value="Renewal soon" tone="warning" />
                <ValuePill value="Auto-renew on" tone="neutral" />
              </div>
            </div>
          </UsageExample>

          <UsageExample title="Risk and recovery" description="Error and info tokens separate blockers from guidance within the same card.">
            <div style={riskCardStyle}>
              <div style={riskRowStyle}>
                <ValuePill value="Config invalid" tone="danger" />
                <span style={riskCaptionStyle}>Download a new profile from Devices.</span>
              </div>
              <div style={infoBannerStyle}>Recovery tip: switch to the fastest node after importing the refreshed config.</div>
            </div>
          </UsageExample>
        </ThreeColumn>
      </StorySection>
    </StoryPage>
  ),
};

function Swatch({ token, borderToken = "--color-border" }: { token: string; borderToken?: string }) {
  return <BoxPreview label="" style={{ width: 72, background: `var(${token})`, borderColor: `var(${borderToken})` }} />;
}

function LinePreview({ token }: { token: string }) {
  return <div style={{ width: 72, height: 12, borderRadius: "999px", background: `var(${token})` }} />;
}

function FocusPreview() {
  return (
    <button
      type="button"
      style={{
        padding: "var(--spacing-2) var(--spacing-3)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        color: "var(--color-text)",
        boxShadow: "0 0 0 3px color-mix(in oklch, var(--color-focus-ring) 28%, transparent)",
      }}
    >
      Focused
    </button>
  );
}

function Ramp({ items }: { items: string[] }) {
  return (
    <div style={{ display: "grid", gap: "var(--spacing-2)", gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))" }}>
      {items.map((token) => (
        <div key={token} style={{ display: "grid", gap: "var(--spacing-1)" }}>
          <div style={{ height: 56, borderRadius: "var(--radius-md)", background: `var(${token})`, border: "1px solid var(--color-border-subtle)" }} />
          <code style={tokenCodeStyle}>{token.replace("--color-", "")}</code>
        </div>
      ))}
    </div>
  );
}

function PaletteColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ display: "grid", gap: "var(--spacing-2)" }}>
      <div style={paletteTitleStyle}>{title}</div>
      {items.map((token) => (
        <div key={token} style={paletteRowStyle}>
          <div style={{ width: 18, height: 18, borderRadius: "999px", background: `var(${token})`, border: "1px solid var(--color-border-subtle)" }} />
          <code style={tokenCodeStyle}>{token}</code>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "success" }) {
  return (
    <div>
      <div style={metricLabelStyle}>{label}</div>
      <div style={{ ...metricValueStyle, color: tone === "success" ? "var(--color-success)" : "var(--color-text)" }}>{value}</div>
    </div>
  );
}

const tokenCodeStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.4,
  color: "var(--color-text-tertiary)",
} as const;

const paletteTitleStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-sm-size)",
  lineHeight: 1.4,
  fontWeight: 600,
} as const;

const paletteRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "var(--spacing-2)",
} as const;

const statusCardStyle = {
  display: "grid",
  gap: "var(--spacing-4)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "color-mix(in oklch, var(--color-surface) 92%, var(--green-d) 8%)",
  border: "1px solid var(--green-b)",
} as const;

const statusTitleRowStyle = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: "var(--spacing-3)",
} as const;

const statusMetaRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "var(--spacing-3)",
} as const;

const metricLabelStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.4,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--color-text-tertiary)",
} as const;

const metricValueStyle = {
  marginTop: "var(--spacing-1)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-size)",
  lineHeight: 1.35,
  fontWeight: 600,
} as const;

const alertCardStyle = {
  display: "grid",
  gap: "var(--spacing-3)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "color-mix(in oklch, var(--color-surface) 94%, var(--amber-d) 6%)",
  border: "1px solid var(--amber-b)",
} as const;

const alertHeadlineStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h3-size)",
  lineHeight: 1.25,
  fontWeight: 600,
  color: "var(--color-text)",
} as const;

const alertBodyStyle = {
  color: "var(--color-text-muted)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.6,
} as const;

const pillRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--spacing-2)",
} as const;

const riskCardStyle = {
  display: "grid",
  gap: "var(--spacing-3)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "color-mix(in oklch, var(--color-surface) 93%, var(--red-d) 7%)",
  border: "1px solid var(--red-b)",
} as const;

const riskRowStyle = {
  display: "grid",
  gap: "var(--spacing-2)",
} as const;

const riskCaptionStyle = {
  color: "var(--color-text-muted)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.6,
} as const;

const infoBannerStyle = {
  padding: "var(--spacing-3)",
  borderRadius: "var(--radius-md)",
  background: "color-mix(in oklch, var(--color-info) 12%, var(--color-surface) 88%)",
  color: "var(--color-info)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.6,
} as const;
