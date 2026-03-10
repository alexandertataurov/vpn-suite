import type { Meta, StoryObj } from "@storybook/react";
import {
  BREAKPOINT_TOKENS,
  COLOR_TOKENS,
  MOTION_TOKENS,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  SPACING_TOKENS,
  TYPOGRAPHY_TOKENS,
  Z_INDEX_TOKENS,
} from "../tokens";
import { StoryCard, StoryPage, StorySection, ThreeColumn, TwoColumn, UsageExample, ValuePill } from "./foundations.story-helpers";

const meta = {
  title: "Design System/Foundations/Showcase",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "One-page overview of the miniapp foundations. This story exists to show the full system working together before you dive into the individual foundation pages.",
          "",
          "## Coverage",
          "Colors, typography, spacing, radius, shadows, motion, breakpoints, and z-index are all represented here.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <StoryPage
      eyebrow="Foundations"
      title="Miniapp foundations overview"
      summary="A fast audit surface for the design system foundations. Use this page to verify the design language feels coherent before checking the detailed reference stories for each token group."
      stats={[
        { label: "Foundation groups", value: "8" },
        { label: "Exported token blocks", value: "100%" },
        { label: "Product examples", value: "4" },
      ]}
    >
      <StorySection
        title="System snapshot"
        description="Each block below represents one foundation group and shows the role it plays in the miniapp."
      >
        <ThreeColumn>
          <StoryCard title="Color" caption={COLOR_TOKENS.accent}>
            <div style={swatchRowStyle}>
              <div style={{ ...swatchStyle, background: `var(${COLOR_TOKENS.bg})` }} />
              <div style={{ ...swatchStyle, background: `var(${COLOR_TOKENS.surface})` }} />
              <div style={{ ...swatchStyle, background: `var(${COLOR_TOKENS.accent})` }} />
              <div style={{ ...swatchStyle, background: `var(${COLOR_TOKENS.success})` }} />
            </div>
          </StoryCard>
          <StoryCard title="Typography" caption={TYPOGRAPHY_TOKENS.typoH1Size}>
            <div style={{ display: "grid", gap: "var(--spacing-2)" }}>
              <div style={h1Style}>Secure connection</div>
              <div style={bodyStyle}>Compact, readable hierarchy for dense mobile flows.</div>
            </div>
          </StoryCard>
          <StoryCard title="Spacing + radius" caption={`${SPACING_TOKENS["4"]} / ${RADIUS_TOKENS.surface}`}>
            <div style={shapeGridStyle}>
              <div style={{ ...shapeStyle, padding: `var(${SPACING_TOKENS["3"]})`, borderRadius: `var(${RADIUS_TOKENS.md})` }}>Row</div>
              <div style={{ ...shapeStyle, padding: `var(${SPACING_TOKENS["4"]})`, borderRadius: `var(${RADIUS_TOKENS.lg})` }}>Card</div>
            </div>
          </StoryCard>
          <StoryCard title="Motion" caption={`${MOTION_TOKENS.durationNormal} / ${MOTION_TOKENS.easeDefault}`}>
            <div style={motionTrackStyle}>
              <div style={motionFillStyle} />
            </div>
          </StoryCard>
          <StoryCard title="Shadow" caption={SHADOW_TOKENS.card}>
            <div style={shadowCardStyle}>Raised surface</div>
          </StoryCard>
          <StoryCard title="Responsive + layers" caption={`${BREAKPOINT_TOKENS.bpSm} / ${Z_INDEX_TOKENS.modal}`}>
            <div style={{ display: "grid", gap: "var(--spacing-2)" }}>
              <ValuePill value="sm 360px" tone="neutral" />
              <ValuePill value="modal layer" tone="accent" />
            </div>
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Integrated miniapp examples"
        description="These examples combine multiple foundation groups so you can judge whether the system remains coherent in realistic screen fragments."
      >
        <TwoColumn>
          <UsageExample title="Connection hero" description="Typography, color, spacing, radius, and motion combine in the screen users see most often.">
            <div style={heroCardStyle}>
              <div style={heroHeaderStyle}>
                <div>
                  <div style={metaStyle}>Connection</div>
                  <div style={heroTitleStyle}>Protected</div>
                </div>
                <ValuePill value="Healthy" tone="success" />
              </div>
              <div style={metricRowStyle}>
                <Metric title="Node" value="Amsterdam, NL" />
                <Metric title="Latency" value="127 ms" accent />
              </div>
              <div style={motionTrackStyle}>
                <div style={{ ...motionFillStyle, width: "84%" }} />
              </div>
            </div>
          </UsageExample>

          <UsageExample title="Plan card" description="The plan card relies on a softer surface radius, compact spacing, and a clear title-price-body stack.">
            <div style={planCardStyle}>
              <div style={metaStyle}>Current plan</div>
              <div style={planTitleStyle}>Pro</div>
              <div style={planPriceStyle}>$9.99 / month</div>
              <div style={bodyMutedStyle}>Unlimited devices, priority routing, and direct support access.</div>
            </div>
          </UsageExample>
        </TwoColumn>
      </StorySection>
    </StoryPage>
  ),
};

function Metric({ title, value, accent = false }: { title: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div style={metaStyle}>{title}</div>
      <div style={{ ...metricValueStyle, color: accent ? "var(--color-accent)" : "var(--color-text)" }}>{value}</div>
    </div>
  );
}

const swatchRowStyle = {
  display: "flex",
  gap: "var(--spacing-2)",
  flexWrap: "wrap",
} as const;

const swatchStyle = {
  width: 40,
  height: 40,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
} as const;

const h1Style = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h1-size)",
  lineHeight: 1.1,
  fontWeight: 600,
} as const;

const bodyStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-sm-size)",
  lineHeight: 1.6,
  color: "var(--color-text-muted)",
} as const;

const bodyMutedStyle = bodyStyle;

const shapeGridStyle = {
  display: "grid",
  gap: "var(--spacing-3)",
} as const;

const shapeStyle = {
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border-subtle)",
  color: "var(--color-text)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-sm-size)",
} as const;

const motionTrackStyle = {
  height: 10,
  borderRadius: 999,
  overflow: "hidden",
  background: "var(--color-border-subtle)",
} as const;

const motionFillStyle = {
  width: "68%",
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg, var(--color-accent), var(--color-success))",
  transition: "width var(--duration-normal) var(--ease-default)",
} as const;

const shadowCardStyle = {
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  boxShadow: `var(${SHADOW_TOKENS.card})`,
} as const;

const heroCardStyle = {
  display: "grid",
  gap: "var(--spacing-4)",
  padding: "var(--spacing-5)",
  borderRadius: "var(--radius-surface)",
  background: "color-mix(in oklch, var(--color-surface) 94%, var(--green-d) 6%)",
  border: "1px solid var(--green-b)",
} as const;

const heroHeaderStyle = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: "var(--spacing-3)",
} as const;

const heroTitleStyle = {
  marginTop: "var(--spacing-1)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h1-size)",
  lineHeight: 1.1,
  fontWeight: 600,
} as const;

const metaStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.4,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--color-text-tertiary)",
} as const;

const metricRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "var(--spacing-3)",
} as const;

const metricValueStyle = {
  marginTop: "var(--spacing-1)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-size)",
  lineHeight: 1.4,
  fontWeight: 600,
} as const;

const planCardStyle = {
  display: "grid",
  gap: "var(--spacing-3)",
  padding: "var(--spacing-5)",
  borderRadius: "var(--radius-surface)",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  boxShadow: `var(${SHADOW_TOKENS.card})`,
} as const;

const planTitleStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h2-size)",
  lineHeight: 1.2,
  fontWeight: 600,
} as const;

const planPriceStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-h3-size)",
  lineHeight: 1.2,
  color: "var(--color-accent)",
} as const;
