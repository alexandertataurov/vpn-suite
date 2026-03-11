import type { Meta, StoryObj } from "@storybook/react";
import { SPACING_TOKENS, TOUCH_TARGET_MIN } from "../tokens";
import { getTokenCoverage, resolveTokenValue } from "../tokens/runtime";
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
  title: "Foundations/Spacing",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "Spacing establishes hierarchy, hit-area safety, and predictable rhythm inside the Telegram miniapp viewport.",
          "",
          "## Coverage",
          "Includes every exported spacing token plus the touch-target minimum used by interactive controls.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Reference: Story = {
  render: () => {
    const spacingSpecs = [
      { name: "Spacing 1", token: SPACING_TOKENS["1"], usage: "Micro gaps inside pills and icon chips.", value: resolveTokenValue(SPACING_TOKENS["1"]), preview: <WidthPreview token={SPACING_TOKENS["1"]} /> },
      { name: "Spacing 2", token: SPACING_TOKENS["2"], usage: "Tight inline gaps and compact row spacing.", value: resolveTokenValue(SPACING_TOKENS["2"]), preview: <WidthPreview token={SPACING_TOKENS["2"]} /> },
      { name: "Spacing 3", token: SPACING_TOKENS["3"], usage: "Default content rhythm between label and helper text.", value: resolveTokenValue(SPACING_TOKENS["3"]), preview: <WidthPreview token={SPACING_TOKENS["3"]} /> },
      { name: "Spacing 4", token: SPACING_TOKENS["4"], usage: "Standard card padding and stack gap.", value: resolveTokenValue(SPACING_TOKENS["4"]), preview: <WidthPreview token={SPACING_TOKENS["4"]} /> },
      { name: "Spacing 5", token: SPACING_TOKENS["5"], usage: "Hero padding and larger internal separation.", value: resolveTokenValue(SPACING_TOKENS["5"]), preview: <WidthPreview token={SPACING_TOKENS["5"]} /> },
      { name: "Spacing 6", token: SPACING_TOKENS["6"], usage: "Section spacing and form group separation.", value: resolveTokenValue(SPACING_TOKENS["6"]), preview: <WidthPreview token={SPACING_TOKENS["6"]} /> },
      { name: "Spacing 8", token: SPACING_TOKENS["8"], usage: "Page-level spacing between major blocks.", value: resolveTokenValue(SPACING_TOKENS["8"]), preview: <WidthPreview token={SPACING_TOKENS["8"]} /> },
      { name: "Spacing 10", token: SPACING_TOKENS["10"], usage: "Large shell spacing and generous emphasis blocks.", value: resolveTokenValue(SPACING_TOKENS["10"]), preview: <WidthPreview token={SPACING_TOKENS["10"]} /> },
      { name: "Spacing 12", token: SPACING_TOKENS["12"], usage: "Maximum exported spacing for prominent separations.", value: resolveTokenValue(SPACING_TOKENS["12"]), preview: <WidthPreview token={SPACING_TOKENS["12"]} /> },
    ];
    const coverage = getTokenCoverage(SPACING_TOKENS);
    return (
    <StoryPage
      eyebrow="Foundations"
      title="Spacing system"
      summary="The miniapp uses a constrained spacing scale to preserve rhythm on narrow viewports, align card internals, and protect touch interactions. This page covers the full exported spacing set and how it maps to layout behavior."
      stats={[
        { label: "Spacing tokens", value: `${coverage.passing} / ${coverage.total}` },
        { label: "Touch target", value: `${TOUCH_TARGET_MIN}px` },
        { label: "Layout examples", value: "3" },
      ]}
    >
      <StorySection
        title="Token reference"
        description="These are the exported spacing tokens used across primitives, components, and page recipes."
      >
        <TokenTable specs={spacingSpecs} />
      </StorySection>

      <StorySection
        title="Spacing rules"
        description="Spacing is not decorative. These rules decide which token to choose before layout work drifts into one-off values."
      >
        <div style={rulesGridStyle}>
          <StoryCard title="Component internals" caption="Use the smallest token that preserves tap clarity and scan rhythm.">
            <div style={rulesListStyle}>
              <ValuePill value="4-8px" tone="neutral" />
              <div style={ruleTextStyle}>Inline gaps, chip padding, icon-to-label spacing.</div>
              <ValuePill value="12-16px" tone="accent" />
              <div style={ruleTextStyle}>Default card padding, label/helper separation, stacked controls.</div>
            </div>
          </StoryCard>
          <StoryCard title="Sections and shells" caption="Only page-scale boundaries should move into the larger end of the scale.">
            <div style={rulesListStyle}>
              <ValuePill value="24px" tone="success" />
              <div style={ruleTextStyle}>Separate form groups, distinct modules, and action zones.</div>
              <ValuePill value="32-48px" tone="warning" />
              <div style={ruleTextStyle}>Reserve for page breaks and major emphasis blocks, not routine card content.</div>
            </div>
          </StoryCard>
        </div>
      </StorySection>

      <StorySection
        title="Layout rhythm"
        description="Spacing is part of the information architecture. These examples show how the same scale controls compact rows, balanced cards, and full-page sectioning."
      >
        <ThreeColumn>
          <StoryCard title="Compact rows" caption="Use `--spacing-2` and `--spacing-3` for dense but readable operational lists.">
            <StackExample gapToken="--spacing-2" itemPaddingToken="--spacing-3" label="gap 8px / padding 12px" />
          </StoryCard>
          <StoryCard title="Card rhythm" caption="Use `--spacing-4` and `--spacing-5` for card internals and CTA groupings.">
            <CardRhythm />
          </StoryCard>
          <StoryCard title="Section rhythm" caption="Use `--spacing-6` and above to separate page-level blocks.">
            <SectionRhythm />
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Miniapp use cases"
        description="Spacing decisions should communicate priority and preserve tap confidence, not just fill empty pixels."
      >
        <TwoColumn>
          <UsageExample title="Primary CTA safety" description="The exported touch target minimum protects buttons inside the Telegram viewport.">
            <div style={ctaExampleStyle}>
              <button type="button" style={touchTargetButtonStyle}>
                Secure connection
              </button>
              <ValuePill value={`Min target ${TOUCH_TARGET_MIN}px`} tone="accent" />
            </div>
          </UsageExample>

          <UsageExample title="Settings density" description="Small metadata gaps keep technical settings readable without making the page feel bloated.">
            <div style={settingsCardStyle}>
              {[
                ["Protocol", "AmneziaWG"],
                ["Config age", "2 days"],
                ["Last handshake", "14 min ago"],
              ].map(([label, value]) => (
                <div key={label} style={settingsRowStyle}>
                  <span style={settingsLabelStyle}>{label}</span>
                  <span style={settingsValueStyle}>{value}</span>
                </div>
              ))}
            </div>
          </UsageExample>
        </TwoColumn>
      </StorySection>
    </StoryPage>
  );
  },
};

function WidthPreview({ token }: { token: string }) {
  return <BoxPreview label="" style={{ width: `var(${token})`, minWidth: `var(${token})`, background: "var(--color-accent)" }} />;
}

function StackExample({
  gapToken,
  itemPaddingToken,
  label,
}: {
  gapToken: string;
  itemPaddingToken: string;
  label: string;
}) {
  return (
    <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
      <ValuePill value={label} tone="neutral" />
      <div style={{ display: "grid", gap: `var(${gapToken})` }}>
        {["Status", "Server", "Subscription"].map((item) => (
          <div
            key={item}
            style={{
              padding: `var(${itemPaddingToken})`,
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function CardRhythm() {
  return (
    <div style={demoCardStyle}>
      <div style={{ display: "grid", gap: "var(--spacing-2)" }}>
        <div style={demoTitleStyle}>Pro plan</div>
        <div style={demoMutedStyle}>Unlimited devices, 1 TB traffic</div>
      </div>
      <div style={{ display: "grid", gap: "var(--spacing-4)" }}>
        <div style={priceStyle}>$9.99/mo</div>
        <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
          <button type="button" style={primaryButtonStyle}>
            Upgrade
          </button>
          <button type="button" style={secondaryButtonStyle}>
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionRhythm() {
  return (
    <div style={{ display: "grid", gap: "var(--spacing-6)" }}>
      <div style={sectionBlockStyle} />
      <div style={sectionSeparatorStyle} />
      <div style={{ ...sectionBlockStyle, height: "var(--spacing-12)" }} />
    </div>
  );
}

const demoCardStyle = {
  display: "grid",
  gap: "var(--spacing-5)",
  padding: "var(--spacing-5)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
} as const;

const demoTitleStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h3-size)",
  lineHeight: 1.3,
  fontWeight: 600,
} as const;

const demoMutedStyle = {
  color: "var(--color-text-muted)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.6,
} as const;

const priceStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-h2-size)",
  lineHeight: 1.1,
  color: "var(--color-accent)",
} as const;

const primaryButtonStyle = {
  minHeight: `${TOUCH_TARGET_MIN}px`,
  padding: "0 var(--spacing-4)",
  borderRadius: "var(--radius-button)",
  border: "none",
  background: "var(--color-accent)",
  color: "var(--color-on-accent)",
} as const;

const secondaryButtonStyle = {
  minHeight: `${TOUCH_TARGET_MIN}px`,
  padding: "0 var(--spacing-4)",
  borderRadius: "var(--radius-button)",
  border: "1px solid var(--color-border)",
  background: "transparent",
  color: "var(--color-text)",
} as const;

const sectionBlockStyle = {
  height: "var(--spacing-8)",
  borderRadius: "var(--radius-md)",
  background: "var(--blue-d)",
} as const;

const sectionSeparatorStyle = {
  height: "var(--spacing-2)",
  width: "100%",
  borderRadius: "999px",
  background: "var(--color-border-subtle)",
} as const;

const ctaExampleStyle = {
  display: "grid",
  gap: "var(--spacing-3)",
  alignItems: "start",
} as const;

const touchTargetButtonStyle = {
  minHeight: `${TOUCH_TARGET_MIN}px`,
  padding: "0 var(--spacing-5)",
  borderRadius: "var(--radius-button)",
  border: "none",
  background: "var(--color-accent)",
  color: "var(--color-on-accent)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-size)",
  fontWeight: 600,
} as const;

const rulesGridStyle = {
  display: "grid",
  gap: "var(--spacing-4)",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
} as const;

const rulesListStyle = {
  display: "grid",
  gap: "var(--spacing-2)",
} as const;

const ruleTextStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-sm-size)",
  lineHeight: 1.6,
  color: "var(--color-text-muted)",
} as const;

const settingsCardStyle = {
  display: "grid",
  gap: "var(--spacing-3)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border-subtle)",
} as const;

const settingsRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--spacing-3)",
} as const;

const settingsLabelStyle = {
  color: "var(--color-text-muted)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-caption-size)",
} as const;

const settingsValueStyle = {
  color: "var(--color-text)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
} as const;
