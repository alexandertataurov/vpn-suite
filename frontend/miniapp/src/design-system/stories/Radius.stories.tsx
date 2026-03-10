import type { Meta, StoryObj } from "@storybook/react";
import { RADIUS_TOKENS } from "../tokens";
import { BoxPreview, StoryCard, StoryPage, StorySection, ThreeColumn, TokenTable, UsageExample } from "./foundations.story-helpers";

const meta = {
  title: "Design System/Foundations/Radius",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Border radius defines tactile feel across chips, controls, cards, and fully rounded status elements. This page covers the full exported radius contract.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const radiusSpecs = [
  { name: "None", token: RADIUS_TOKENS.none, usage: "Hard-edged utility surfaces.", preview: <Shape token={RADIUS_TOKENS.none} /> },
  { name: "Small", token: RADIUS_TOKENS.sm, usage: "Tight utility blocks and compact tags.", preview: <Shape token={RADIUS_TOKENS.sm} /> },
  { name: "Medium", token: RADIUS_TOKENS.md, usage: "Inputs, compact cards, and item rows.", preview: <Shape token={RADIUS_TOKENS.md} /> },
  { name: "Large", token: RADIUS_TOKENS.lg, usage: "Primary cards and grouped surfaces.", preview: <Shape token={RADIUS_TOKENS.lg} /> },
  { name: "Extra large", token: RADIUS_TOKENS.xl, usage: "Prominent containers and larger hero blocks.", preview: <Shape token={RADIUS_TOKENS.xl} /> },
  { name: "2XL", token: RADIUS_TOKENS["2xl"], usage: "Large framed surfaces when a softer silhouette is needed.", preview: <Shape token={RADIUS_TOKENS["2xl"]} /> },
  { name: "Full", token: RADIUS_TOKENS.full, usage: "Pills, badges, and circular framing.", preview: <Shape token={RADIUS_TOKENS.full} /> },
  { name: "Control", token: RADIUS_TOKENS.control, usage: "Default control radius shared by inputs and selectors.", preview: <Shape token={RADIUS_TOKENS.control} /> },
  { name: "Surface", token: RADIUS_TOKENS.surface, usage: "Canonical card and module surface radius.", preview: <Shape token={RADIUS_TOKENS.surface} /> },
  { name: "Button", token: RADIUS_TOKENS.button, usage: "Primary and secondary CTA silhouette.", preview: <Shape token={RADIUS_TOKENS.button} /> },
];

export const Reference: Story = {
  render: () => (
    <StoryPage
      eyebrow="Foundations"
      title="Radius system"
      summary="Radius is part of the product voice: controls feel precise, cards feel softer, and pills remain unmistakably status-driven. These tokens define that shape language."
      stats={[
        { label: "Radius tokens", value: String(radiusSpecs.length) },
        { label: "Control families", value: "3" },
        { label: "Examples", value: "3" },
      ]}
    >
      <StorySection
        title="Token reference"
        description="Each exported radius token is documented below with its primary job in the design system."
      >
        <TokenTable specs={radiusSpecs} />
      </StorySection>

      <StorySection
        title="Shape language in use"
        description="The radius scale should create distinction between dense controls, content modules, and status treatments."
      >
        <ThreeColumn>
          <StoryCard title="Controls" caption="Medium and control radii keep fields precise and tappable.">
            <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
              <BoxPreview label="Input" style={{ width: "100%", justifyContent: "flex-start", borderRadius: "var(--radius-control)" }} />
              <BoxPreview label="Select" style={{ width: "100%", justifyContent: "flex-start", borderRadius: "var(--radius-md)" }} />
            </div>
          </StoryCard>
          <StoryCard title="Surfaces" caption="Large and surface radii are the default silhouette for miniapp cards.">
            <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
              <BoxPreview label="Plan card" style={{ width: "100%", minHeight: 96, borderRadius: "var(--radius-surface)" }} />
              <BoxPreview label="Hero block" style={{ width: "100%", minHeight: 72, borderRadius: "var(--radius-lg)" }} />
            </div>
          </StoryCard>
          <StoryCard title="Signals" caption="Fully rounded shapes reserve visual language for status and lightweight metadata.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-2)" }}>
              <Pill label="Connected" background="var(--green-d)" color="var(--color-success)" />
              <Pill label="Renewal soon" background="var(--amber-d)" color="var(--color-warning)" />
              <Pill label="Blocked" background="var(--red-d)" color="var(--color-error)" />
            </div>
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Miniapp use case"
        description="A single card often combines multiple radii. The distinction helps users parse hierarchy even when they only glance."
      >
        <UsageExample title="Devices card" description="Outer surface radius frames the module while nested controls use tighter radii for precision.">
          <div style={deviceCardStyle}>
            <div style={deviceHeaderStyle}>
              <div>
                <div style={deviceTitleStyle}>MacBook Air</div>
                <div style={deviceCaptionStyle}>Last active 14 minutes ago</div>
              </div>
              <Pill label="Healthy" background="var(--green-d)" color="var(--color-success)" />
            </div>
            <div style={deviceActionRowStyle}>
              <button type="button" style={secondaryActionStyle}>
                View config
              </button>
              <button type="button" style={primaryActionStyle}>
                Reissue
              </button>
            </div>
          </div>
        </UsageExample>
      </StorySection>
    </StoryPage>
  ),
};

function Shape({ token }: { token: string }) {
  return <BoxPreview label="" style={{ width: 72, height: 56, borderRadius: `var(${token})`, background: "var(--blue-d)", borderColor: "var(--blue-b)" }} />;
}

function Pill({ label, background, color }: { label: string; background: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-1) var(--spacing-3)",
        borderRadius: "var(--radius-full)",
        background,
        color,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--typo-caption-size)",
        lineHeight: 1.3,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

const deviceCardStyle = {
  display: "grid",
  gap: "var(--spacing-4)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-surface)",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
} as const;

const deviceHeaderStyle = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: "var(--spacing-3)",
} as const;

const deviceTitleStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h3-size)",
  lineHeight: 1.25,
  fontWeight: 600,
} as const;

const deviceCaptionStyle = {
  marginTop: "var(--spacing-1)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.6,
  color: "var(--color-text-muted)",
} as const;

const deviceActionRowStyle = {
  display: "flex",
  gap: "var(--spacing-2)",
} as const;

const secondaryActionStyle = {
  minHeight: "48px",
  padding: "0 var(--spacing-4)",
  borderRadius: "var(--radius-control)",
  border: "1px solid var(--color-border)",
  background: "transparent",
  color: "var(--color-text)",
} as const;

const primaryActionStyle = {
  minHeight: "48px",
  padding: "0 var(--spacing-4)",
  borderRadius: "var(--radius-button)",
  border: "none",
  background: "var(--color-accent)",
  color: "var(--color-on-accent)",
} as const;
