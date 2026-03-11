import type { Meta, StoryObj } from "@storybook/react";
import { MOTION_DURATION_MS, MOTION_TOKENS } from "../tokens";
import { StoryCard, StoryPage, StorySection, ThreeColumn, TokenTable, UsageExample } from "./foundations.story-helpers";

const meta = {
  title: "Foundations/Motion",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Motion tokens define tempo and easing for interactive feedback. They should make the miniapp feel responsive without adding decorative drag.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const motionSpecs = [
  { name: "Duration fast", token: MOTION_TOKENS.durationFast, usage: "Micro feedback such as hover or pressed transitions.", note: `${MOTION_DURATION_MS.fast}ms`, preview: <DurationBadge label={`${MOTION_DURATION_MS.fast}ms`} /> },
  { name: "Duration normal", token: MOTION_TOKENS.durationNormal, usage: "Default component transitions.", note: `${MOTION_DURATION_MS.normal}ms`, preview: <DurationBadge label={`${MOTION_DURATION_MS.normal}ms`} /> },
  { name: "Duration slow", token: MOTION_TOKENS.durationSlow, usage: "Larger state changes or page-level transitions.", note: `${MOTION_DURATION_MS.slow}ms`, preview: <DurationBadge label={`${MOTION_DURATION_MS.slow}ms`} /> },
  { name: "Ease default", token: MOTION_TOKENS.easeDefault, usage: "Balanced motion curve for general interactions.", preview: <CurveBadge label="default" /> },
  { name: "Ease in", token: MOTION_TOKENS.easeIn, usage: "Enter motion that should feel deliberate at the end.", preview: <CurveBadge label="in" /> },
  { name: "Ease out", token: MOTION_TOKENS.easeOut, usage: "Exit or reveal motion that needs to feel responsive immediately.", preview: <CurveBadge label="out" /> },
  { name: "Ease in out", token: MOTION_TOKENS.easeInOut, usage: "Balanced transition when both start and end matter.", preview: <CurveBadge label="in-out" /> },
];

const motionUsageRows = [
  { token: MOTION_TOKENS.durationFast, value: `${MOTION_DURATION_MS.fast}ms`, usedFor: "Press states, hover, chips, toggles", easing: "var(--ease-out)" },
  { token: MOTION_TOKENS.durationNormal, value: `${MOTION_DURATION_MS.normal}ms`, usedFor: "Panel slide, tab switch, accordion, progress fill", easing: "var(--ease-in-out)" },
  { token: MOTION_TOKENS.durationSlow, value: `${MOTION_DURATION_MS.slow}ms`, usedFor: "Modal entry and larger state transitions only", easing: "var(--ease-default)" },
  { token: "--duration-instant", value: "0ms", usedFor: "Reduced-motion override", easing: "none" },
] as const;

export const Reference: Story = {
  render: () => (
    <StoryPage
      eyebrow="Foundations"
      title="Motion system"
      summary="Motion is intentionally restrained in the miniapp. Tokens encode timing decisions so buttons, sheets, and status shifts feel coherent instead of individually improvised."
      stats={[
        { label: "Motion tokens", value: String(motionSpecs.length) },
        { label: "Durations", value: String(Object.keys(MOTION_DURATION_MS).length) },
        { label: "Examples", value: "3" },
      ]}
    >
      <StorySection
        title="Token reference"
        description="Each exported motion token is mapped to its intended job in the interface."
      >
        <TokenTable specs={motionSpecs} />
      </StorySection>

      <StorySection
        title="Timing guidance"
        description="Choose the shortest duration that still preserves clarity. Fast is for acknowledgement, normal is the default, slow is reserved for larger state changes."
      >
        <ThreeColumn>
          <StoryCard title="Fast" caption="Use for button press, icon fade, or small hover feedback.">
            <AnimatedBar durationToken={MOTION_TOKENS.durationFast} color="var(--color-accent)" />
          </StoryCard>
          <StoryCard title="Normal" caption="Use for default collapses, inline alerts, and sheet affordances.">
            <AnimatedBar durationToken={MOTION_TOKENS.durationNormal} color="var(--color-info)" />
          </StoryCard>
          <StoryCard title="Slow" caption="Use only when the user needs to track a larger transition.">
            <AnimatedBar durationToken={MOTION_TOKENS.durationSlow} color="var(--color-success)" />
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Usage mapping"
        description="Duration choice should be predictable. Pick from this table instead of improvising a new tempo."
      >
        <div style={usageTableStyle}>
          {motionUsageRows.map((row) => (
            <div key={row.token} style={usageRowStyle}>
              <code style={metaStyle}>{row.token}</code>
              <span style={valueStyle}>{row.value}</span>
              <span style={captionStyle}>{row.usedFor}</span>
              <code style={metaStyle}>{row.easing}</code>
            </div>
          ))}
        </div>
      </StorySection>

      <StorySection
        title="Miniapp use case"
        description="Motion should help the user understand what changed, especially in status-heavy operational flows. Every transition must also have a reduced-motion fallback."
      >
        <UsageExample title="Connection state transition" description="Status chips, banners, and progress indicators should move on the same timing grid so the screen feels coherent during reconnects.">
          <div style={transitionCardStyle}>
            <div style={transitionHeaderStyle}>
              <span style={metaStyle}>State</span>
              <span style={successPillStyle}>Reconnected</span>
            </div>
            <div style={progressTrackStyle}>
              <div style={progressFillStyle} />
            </div>
            <div style={captionStyle}>Use normal duration for the bar fill and fast duration for the chip tone update.</div>
            <pre style={reducedMotionBlockStyle}>
{`@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0ms !important;
    animation-duration: 0ms !important;
  }
}`}
            </pre>
          </div>
        </UsageExample>
      </StorySection>
    </StoryPage>
  ),
};

function DurationBadge({ label }: { label: string }) {
  return <span style={durationBadgeStyle}>{label}</span>;
}

function CurveBadge({ label }: { label: string }) {
  return <span style={curveBadgeStyle}>{label}</span>;
}

function AnimatedBar({ durationToken, color }: { durationToken: string; color: string }) {
  return (
    <div style={animatedTrackStyle}>
      <div
        style={{
          ...animatedFillStyle,
          width: "72%",
          background: color,
          animationDuration: `var(${durationToken})`,
        }}
      />
    </div>
  );
}

const durationBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 72,
  minHeight: 36,
  padding: "0 var(--spacing-3)",
  borderRadius: "var(--radius-full)",
  background: "var(--blue-d)",
  color: "var(--color-accent)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
} as const;

const curveBadgeStyle = {
  ...durationBadgeStyle,
  background: "var(--color-surface-2)",
  color: "var(--color-text)",
} as const;

const animatedTrackStyle = {
  position: "relative" as const,
  overflow: "hidden",
  height: 12,
  borderRadius: 999,
  background: "var(--color-border-subtle)",
} as const;

const animatedFillStyle = {
  height: "100%",
  borderRadius: 999,
  transition: "width var(--duration-normal) var(--ease-in-out)",
} as const;

const usageTableStyle = {
  display: "grid",
  gap: "var(--spacing-2)",
} as const;

const usageRowStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 96px minmax(0, 1.8fr) minmax(0, 1fr)",
  gap: "var(--spacing-3)",
  alignItems: "center",
  padding: "var(--spacing-3)",
  borderRadius: "var(--radius-md)",
  background: "color-mix(in oklch, var(--color-surface) 92%, var(--color-surface-2) 8%)",
} as const;

const valueStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  color: "var(--color-text)",
} as const;

const transitionCardStyle = {
  display: "grid",
  gap: "var(--spacing-3)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
} as const;

const transitionHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
} as const;

const metaStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.4,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--color-text-tertiary)",
} as const;

const successPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "var(--spacing-1) var(--spacing-3)",
  borderRadius: "var(--radius-full)",
  background: "var(--green-d)",
  color: "var(--color-success)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  fontWeight: 600,
} as const;

const progressTrackStyle = {
  position: "relative" as const,
  height: 10,
  borderRadius: 999,
  background: "var(--color-border-subtle)",
  overflow: "hidden",
} as const;

const progressFillStyle = {
  width: "82%",
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg, var(--color-accent), var(--color-success))",
  transition: "width var(--duration-normal) var(--ease-default), background var(--duration-fast) var(--ease-out)",
} as const;

const captionStyle = {
  color: "var(--color-text-muted)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.6,
} as const;

const reducedMotionBlockStyle = {
  margin: 0,
  padding: "var(--spacing-3)",
  borderRadius: "var(--radius-md)",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border-subtle)",
  color: "var(--color-text-muted)",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
} as const;
