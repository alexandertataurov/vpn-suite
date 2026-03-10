import type { Meta, StoryObj } from "@storybook/react";
import { SHADOW_TOKENS } from "../tokens";
import { BoxPreview, StoryCard, StoryPage, StorySection, ThreeColumn, TokenTable, UsageExample } from "./foundations.story-helpers";

const meta = {
  title: "Design System/Foundations/Shadows",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Shadow tokens are intentionally restrained in the miniapp. Most surfaces stay flat, with optional elevation reserved for overlays, focus states, and light-theme support.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const shadowSpecs = [
  { name: "None", token: SHADOW_TOKENS.none, usage: "Default flat surfaces and dark-theme cards.", preview: <ShadowPreview token={SHADOW_TOKENS.none} /> },
  { name: "Small", token: SHADOW_TOKENS.sm, usage: "Minimal separation in lighter contexts.", preview: <ShadowPreview token={SHADOW_TOKENS.sm} /> },
  { name: "Medium", token: SHADOW_TOKENS.md, usage: "Elevated surfaces with moderate emphasis.", preview: <ShadowPreview token={SHADOW_TOKENS.md} /> },
  { name: "Large", token: SHADOW_TOKENS.lg, usage: "Dialogs and strongly elevated overlays.", preview: <ShadowPreview token={SHADOW_TOKENS.lg} /> },
  { name: "Card", token: SHADOW_TOKENS.card, usage: "Canonical card elevation token.", preview: <ShadowPreview token={SHADOW_TOKENS.card} /> },
  { name: "Focus ring", token: SHADOW_TOKENS.focusRing, usage: "Accessible focus outline rendered as a shadow.", preview: <FocusRingPreview /> },
];

export const Reference: Story = {
  render: () => (
    <StoryPage
      eyebrow="Foundations"
      title="Shadow system"
      summary="The miniapp mostly communicates depth through color, border, and radius. Shadow tokens still exist for cases where a stronger layer cue is necessary, especially on light backgrounds and interactive focus states."
      stats={[
        { label: "Shadow tokens", value: String(shadowSpecs.length) },
        { label: "Default card depth", value: "Flat" },
        { label: "Examples", value: "3" },
      ]}
    >
      <StorySection
        title="Token reference"
        description="Every exported shadow token and its intended usage."
      >
        <TokenTable specs={shadowSpecs} />
      </StorySection>

      <StorySection
        title="Depth strategy"
        description="Use shadow only when border and surface contrast are not enough to explain the layer."
      >
        <ThreeColumn>
          <StoryCard title="Flat card" caption="Default dark-theme surface treatment.">
            <ShadowPreview token={SHADOW_TOKENS.none} />
          </StoryCard>
          <StoryCard title="Raised panel" caption="Use medium or card shadow for a floating utility panel.">
            <ShadowPreview token={SHADOW_TOKENS.card} />
          </StoryCard>
          <StoryCard title="Focus treatment" caption="Keyboard focus should be clearer than hover.">
            <FocusRingPreview />
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Miniapp use case"
        description="Overlays are the clearest justification for depth in the miniapp because they sit above active page content."
      >
        <UsageExample title="Popover layer" description="Use border, radius, and optional elevation together so the layer reads correctly in both dark and light themes.">
          <div style={popoverStyle}>
            <div style={popoverTitleStyle}>Quick actions</div>
            <div style={popoverItemStyle}>Copy endpoint</div>
            <div style={popoverItemStyle}>Reissue config</div>
            <div style={popoverItemStyle}>Disable device</div>
          </div>
        </UsageExample>
      </StorySection>
    </StoryPage>
  ),
};

function ShadowPreview({ token }: { token: string }) {
  return (
    <BoxPreview
      label="Surface"
      style={{
        width: "100%",
        minHeight: 80,
        borderRadius: "var(--radius-lg)",
        background: "var(--color-surface-2)",
        boxShadow: `var(${token})`,
      }}
    />
  );
}

function FocusRingPreview() {
  return (
    <button
      type="button"
      style={{
        minHeight: 48,
        padding: "0 var(--spacing-4)",
        borderRadius: "var(--radius-button)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        color: "var(--color-text)",
        boxShadow: `var(${SHADOW_TOKENS.focusRing})`,
      }}
    >
      Focused action
    </button>
  );
}

const popoverStyle = {
  display: "grid",
  gap: "var(--spacing-2)",
  width: "min(280px, 100%)",
  padding: "var(--spacing-3)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  boxShadow: `var(${SHADOW_TOKENS.lg})`,
} as const;

const popoverTitleStyle = {
  padding: "var(--spacing-2) var(--spacing-2)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.4,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--color-text-tertiary)",
} as const;

const popoverItemStyle = {
  padding: "var(--spacing-3)",
  borderRadius: "var(--radius-md)",
  background: "var(--color-surface-2)",
  color: "var(--color-text)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-sm-size)",
  lineHeight: 1.4,
} as const;
