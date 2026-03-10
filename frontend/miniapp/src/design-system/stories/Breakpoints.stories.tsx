import type { Meta, StoryObj } from "@storybook/react";
import { BREAKPOINT_PX, BREAKPOINT_TOKENS } from "../tokens";
import { StoryCard, StoryPage, StorySection, ThreeColumn, TokenTable, UsageExample, ValuePill } from "./foundations.story-helpers";

const meta = {
  title: "Design System/Foundations/Breakpoints",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Breakpoint foundations define the major viewport shifts used by the miniapp. They protect usability across narrow phones, larger phones, and desktop preview widths.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const breakpointSpecs = [
  { name: "Small breakpoint", token: BREAKPOINT_TOKENS.bpSm, usage: "First responsive step for slightly wider phones.", note: `${BREAKPOINT_PX.sm}px`, preview: <ValuePill value={`${BREAKPOINT_PX.sm}px`} /> },
  { name: "Medium breakpoint", token: BREAKPOINT_TOKENS.bpMd, usage: "Second responsive step for tablet-like or desktop preview widths.", note: `${BREAKPOINT_PX.md}px`, preview: <ValuePill value={`${BREAKPOINT_PX.md}px`} tone="accent" /> },
];

export const Reference: Story = {
  render: () => (
    <StoryPage
      eyebrow="Foundations"
      title="Breakpoint system"
      summary="The miniapp keeps its responsive model deliberately small. These breakpoints govern when layouts may expand horizontally and when mobile-first stacking should remain untouched."
      stats={[
        { label: "Breakpoint tokens", value: String(breakpointSpecs.length) },
        { label: "Viewport steps", value: "3" },
        { label: "Examples", value: "3" },
      ]}
    >
      <StorySection
        title="Token reference"
        description="Every exported breakpoint token plus its JavaScript pixel counterpart."
      >
        <TokenTable specs={breakpointSpecs} />
      </StorySection>

      <StorySection
        title="Viewport strategy"
        description="Responsive behavior is intentionally conservative. Most layouts remain single-column until there is clear room for side-by-side content."
      >
        <ThreeColumn>
          <StoryCard title="Under 360px" caption="Preserve single-column layouts and compact copy.">
            <ViewportFrame width={320} label="320" description="Single column, stacked controls." />
          </StoryCard>
          <StoryCard title="360px and up" caption="Allow slightly wider cards and more comfortable inline actions.">
            <ViewportFrame width={360} label="360" description="Primary responsive step." />
          </StoryCard>
          <StoryCard title="600px and up" caption="Desktop preview and wide-container adaptations.">
            <ViewportFrame width={600} label="600" description="Two-column opportunities." />
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Miniapp use case"
        description="The same devices screen should remain clear on a narrow phone and still take advantage of extra space when previewed wider."
      >
        <UsageExample title="Devices list expansion" description="At medium width, metadata can move inline without compromising primary actions.">
          <div style={devicesLayoutStyle}>
            <div style={devicePaneStyle}>
              <div style={paneTitleStyle}>Phone</div>
              <div style={paneBodyStyle}>iPhone 15 Pro</div>
            </div>
            <div style={devicePaneStyle}>
              <div style={paneTitleStyle}>Laptop</div>
              <div style={paneBodyStyle}>MacBook Air</div>
            </div>
          </div>
        </UsageExample>
      </StorySection>
    </StoryPage>
  ),
};

function ViewportFrame({ width, label, description }: { width: number; label: string; description: string }) {
  return (
    <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
      <div style={{ ...viewportFrameStyle, width: `${Math.min(width / 2, 240)}px` }}>
        <div style={viewportHeaderStyle}>
          <span style={viewportLabelStyle}>{label}px</span>
          <span style={viewportLabelStyle}>Preview</span>
        </div>
        <div style={viewportCardStyle} />
        <div style={viewportCardStyle} />
      </div>
      <div style={viewportDescriptionStyle}>{description}</div>
    </div>
  );
}

const viewportFrameStyle = {
  display: "grid",
  gap: "var(--spacing-2)",
  padding: "var(--spacing-3)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
} as const;

const viewportHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
} as const;

const viewportLabelStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.4,
  color: "var(--color-text-tertiary)",
} as const;

const viewportCardStyle = {
  height: 40,
  borderRadius: "var(--radius-md)",
  background: "var(--blue-d)",
  border: "1px solid var(--blue-b)",
} as const;

const viewportDescriptionStyle = {
  color: "var(--color-text-muted)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.6,
} as const;

const devicesLayoutStyle = {
  display: "grid",
  gap: "var(--spacing-3)",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
} as const;

const devicePaneStyle = {
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
} as const;

const paneTitleStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.4,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--color-text-tertiary)",
} as const;

const paneBodyStyle = {
  marginTop: "var(--spacing-2)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-size)",
  lineHeight: 1.4,
  fontWeight: 600,
} as const;
