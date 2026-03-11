import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";
import { HomeHeroPanel } from "../patterns/home/HomeHeroPanel";
import { BREAKPOINT_PX, BREAKPOINT_TOKENS } from "../tokens";
import { StoryCard, StoryPage, StorySection, TokenTable, UsageExample, ValuePill } from "./foundations.story-helpers";

const meta = {
  title: "Foundations/Breakpoints",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Breakpoint foundations define the major viewport shifts used by the miniapp. Use this page to review exact width behavior instead of relying on approximate browser resizes.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const breakpointSpecs = [
  { name: "Small breakpoint", token: BREAKPOINT_TOKENS.bpSm, usage: "Telegram WebView minimum width and first supported phone breakpoint.", note: `${BREAKPOINT_PX.sm}px`, preview: <ValuePill value={`${BREAKPOINT_PX.sm}px`} /> },
  { name: "Medium breakpoint", token: BREAKPOINT_TOKENS.bpMd, usage: "Wide-phone, tablet, and desktop preview breakpoint where layouts may begin expanding horizontally.", note: `${BREAKPOINT_PX.md}px`, preview: <ValuePill value={`${BREAKPOINT_PX.md}px`} tone="accent" /> },
];

const matrixWidths = [
  { name: "sm", label: "Telegram min", width: BREAKPOINT_PX.sm },
  { name: "phone", label: "Large phone", width: 430 },
  { name: "md", label: "Tablet split", width: BREAKPOINT_PX.md },
  { name: "xl", label: "Desktop", width: 1024 },
] as const;

export const Reference: Story = {
  render: () => (
    <StoryPage
      eyebrow="Foundations"
      title="Breakpoint system"
      summary="The miniapp keeps its responsive model deliberately small. These breakpoints govern when layouts may expand horizontally and when mobile-first stacking should remain untouched."
      stats={[
        { label: "Breakpoint tokens", value: String(breakpointSpecs.length) },
        { label: "Matrix widths", value: String(matrixWidths.length) },
        { label: "Examples", value: "2" },
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
        <div style={strategyGridStyle}>
          <StoryCard title="Below 390px" caption="Graceful fallback only. Avoid overflow, but do not optimize primary layouts here.">
            <ValuePill value="Unsupported primary target" tone="warning" />
          </StoryCard>
          <StoryCard title="390px and up" caption="The actual miniapp mobile baseline. Prioritize readability and thumb reach first.">
            <ValuePill value="Primary mobile baseline" tone="success" />
          </StoryCard>
          <StoryCard title="600px and up" caption="Desktop preview and wide-container adaptations may introduce inline metadata and split panels.">
            <ValuePill value="Two-column opportunities" tone="accent" />
          </StoryCard>
        </div>
      </StorySection>

      <StorySection
        title="Miniapp use case"
        description="The same hero and action stack should remain readable on a narrow phone and use extra space deliberately on wider previews."
      >
        <UsageExample title="Hero plus actions" description="At 600px and above, actions can move beside the hero instead of staying below it.">
          <BreakpointShell width={BREAKPOINT_PX.md} />
        </UsageExample>
      </StorySection>
    </StoryPage>
  ),
};

export const BreakpointMatrix: Story = {
  render: () => (
    <StoryPage
      eyebrow="Foundations"
      title="Breakpoint matrix"
      summary="Each frame below renders at an exact width so reviewers can see where layout behavior changes instead of inferring it from pills or docs alone."
      stats={[
        { label: "Frames", value: String(matrixWidths.length) },
        { label: "Switch point", value: `${BREAKPOINT_PX.md}px` },
        { label: "Real fragment", value: "Home hero" },
      ]}
    >
      <StorySection
        title="Exact-width review"
        description="These previews use the same Home hero pattern and a shared action surface, with the shell changing layout only when the width crosses the medium breakpoint."
      >
        <div style={matrixStackStyle}>
          {matrixWidths.map((item) => (
            <BreakpointFrame key={item.name} name={item.name} label={item.label} width={item.width}>
              <BreakpointShell width={item.width} />
            </BreakpointFrame>
          ))}
        </div>
      </StorySection>
    </StoryPage>
  ),
};

function BreakpointFrame({
  children,
  name,
  label,
  width,
}: {
  children: ReactNode;
  name: string;
  label: string;
  width: number;
}) {
  return (
    <div style={frameWrapStyle}>
      <div style={frameHeaderStyle}>
        <div style={frameTitleStyle}>
          <span>{name}</span>
          <span style={frameLabelStyle}>{label}</span>
        </div>
        <ValuePill value={`${width}px`} tone={width >= BREAKPOINT_PX.md ? "accent" : "neutral"} />
      </div>
      <div style={{ ...frameViewportStyle, width }}>
        {children}
      </div>
    </div>
  );
}

function BreakpointShell({ width }: { width: number }) {
  const wide = width >= BREAKPOINT_PX.md;
  return (
    <div style={{ ...shellStyle, gridTemplateColumns: wide ? "minmax(0, 1.2fr) minmax(240px, 0.8fr)" : "minmax(0, 1fr)" }}>
      <HomeHeroPanel
        variant={wide ? "degraded" : "connected"}
        statusText={wide ? "Tunnel active" : "Protected"}
        statusHint={wide ? "Traffic is protected, but latency is elevated and route quality is degraded." : "Traffic is protected through the fastest healthy route."}
        latencyLabel="127 ms"
        latencyTone="amber"
        subscriptionLabel="Pro"
        subscriptionTone="green"
        bandwidthLabel="124 GB"
        bandwidthTone="green"
        timeLeftLabel="3 days left"
        timeLeftTone="amber"
        serverLocation="Amsterdam"
        serverId="ams-03"
      />
      <div style={actionCardStyle}>
        <div style={metaStyle}>Quick actions</div>
        <div style={actionListStyle}>
          <div style={actionRowStyle}>
            <span>Switch node</span>
            <ValuePill value="Primary" tone="accent" />
          </div>
          <div style={actionRowStyle}>
            <span>Plan status</span>
            <ValuePill value="Renew soon" tone="warning" />
          </div>
          <div style={actionRowStyle}>
            <span>Bandwidth</span>
            <ValuePill value="64%" tone="success" />
          </div>
        </div>
      </div>
    </div>
  );
}

const strategyGridStyle = {
  display: "grid",
  gap: "var(--spacing-4)",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
} as const;

const matrixStackStyle = {
  display: "grid",
  gap: "var(--spacing-5)",
  overflowX: "auto",
} as const;

const frameWrapStyle = {
  display: "grid",
  gap: "var(--spacing-3)",
} as const;

const frameHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--spacing-3)",
} as const;

const frameTitleStyle = {
  display: "flex",
  alignItems: "baseline",
  gap: "var(--spacing-2)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-size)",
  fontWeight: 600,
} as const;

const frameLabelStyle = {
  color: "var(--color-text-muted)",
  fontWeight: 400,
} as const;

const frameViewportStyle = {
  maxWidth: "100%",
  overflow: "hidden",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-xl)",
  border: "1px solid var(--color-border)",
  background: "color-mix(in oklch, var(--color-surface) 94%, var(--color-surface-2) 6%)",
} as const;

const shellStyle = {
  display: "grid",
  gap: "var(--spacing-4)",
  alignItems: "start",
} as const;

const actionCardStyle = {
  display: "grid",
  gap: "var(--spacing-3)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-2)",
} as const;

const metaStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.4,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--color-text-tertiary)",
} as const;

const actionListStyle = {
  display: "grid",
  gap: "var(--spacing-2)",
} as const;

const actionRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--spacing-3)",
  padding: "var(--spacing-3)",
  borderRadius: "var(--radius-md)",
  background: "color-mix(in oklch, var(--color-surface) 88%, var(--color-surface-2) 12%)",
} as const;
