import type { Meta, StoryObj } from "@storybook/react";
import { SHADOW_TOKENS } from "@/design-system/core/tokens";
import { getTokenCoverage, resolveTokenValue } from "@/design-system/core/tokens/runtime";
import { BoxPreview, StoryCard, StoryPage, StorySection, ThreeColumn, TokenTable, UsageExample } from "@/design-system/utils/story-helpers";

const meta = {
  title: "Foundations/Shadows",
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

export const Reference: Story = {
  render: () => {
    const shadowSpecs = [
      { name: "None", token: SHADOW_TOKENS.none, usage: "Default flat surfaces and dark-theme cards.", value: resolveTokenValue(SHADOW_TOKENS.none), preview: <ShadowPreview token={SHADOW_TOKENS.none} /> },
      { name: "Small", token: SHADOW_TOKENS.sm, usage: "Minimal separation in lighter contexts.", value: resolveTokenValue(SHADOW_TOKENS.sm), preview: <ShadowPreview token={SHADOW_TOKENS.sm} /> },
      { name: "Medium", token: SHADOW_TOKENS.md, usage: "Elevated surfaces with moderate emphasis.", value: resolveTokenValue(SHADOW_TOKENS.md), preview: <ShadowPreview token={SHADOW_TOKENS.md} /> },
      { name: "Large", token: SHADOW_TOKENS.lg, usage: "Dialogs and strongly elevated overlays.", value: resolveTokenValue(SHADOW_TOKENS.lg), preview: <ShadowPreview token={SHADOW_TOKENS.lg} /> },
      { name: "Card", token: SHADOW_TOKENS.card, usage: "Canonical card elevation token.", value: resolveTokenValue(SHADOW_TOKENS.card), preview: <ShadowPreview token={SHADOW_TOKENS.card} /> },
      { name: "Focus ring", token: SHADOW_TOKENS.focusRing, usage: "Accessible focus outline rendered as a shadow.", value: resolveTokenValue(SHADOW_TOKENS.focusRing), preview: <FocusRingPreview /> },
    ];
    const coverage = getTokenCoverage(SHADOW_TOKENS);
    return (
    <StoryPage
      eyebrow="Foundations"
      title="Shadow system"
      summary="The miniapp mostly communicates depth through color, border, and radius. Shadow tokens still exist for cases where a stronger layer cue is necessary, especially on light backgrounds and interactive focus states."
      stats={[
        { label: "Shadow tokens", value: `${coverage.passing} / ${coverage.total}` },
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
        title="Shadow policy"
        description="Shadow is an exception, not the default depth language. Reach for it only after border and surface contrast are insufficient."
      >
        <div style={shadowPolicyGridStyle}>
          <StoryCard title="Allowed" caption="Floating layers, focus states, and some light-theme utilities.">
            <div style={shadowPolicyTextStyle}>Use `--shadow-md`, `--shadow-lg`, or `--focus-ring` when the layer must detach from active content.</div>
          </StoryCard>
          <StoryCard title="Avoid" caption="Routine dark-theme cards and standard module surfaces.">
            <div style={shadowPolicyTextStyle}>Prefer flat cards with border and surface contrast before adding elevation.</div>
          </StoryCard>
        </div>
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
  );
  },
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

const shadowPolicyGridStyle = {
  display: "grid",
  gap: "var(--spacing-4)",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
} as const;

const shadowPolicyTextStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-sm-size)",
  lineHeight: 1.6,
  color: "var(--color-text-muted)",
} as const;
