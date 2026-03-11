import React from "react";
import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { HomeHeroPanel } from "../patterns/home/HomeHeroPanel";
import { TYPOGRAPHY_TOKENS } from "../tokens";
import {
  StoryCard,
  StoryPage,
  StorySection,
  ThreeColumn,
  TokenTable,
  TwoColumn,
  UsageExample,
} from "./foundations.story-helpers";

const meta = {
  title: "Foundations/Typography",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "Typography foundations cover the miniapp font families, semantic sizing tokens, and content-library type scale with concrete px values, line heights, and weights.",
          "",
          "## Coverage",
          "This page includes every exported typography token, shows the canonical values from the consumer theme, and demonstrates how the scale behaves in real miniapp layouts.",
          "",
          "## Token families",
          "- `--typo-*` is the semantic, global type scale for the miniapp.",
          "- `--ds-font-*` is a miniapp alias layer for page/section/card/body/caption/label sizing and is mapped onto `--typo-*`. New work should prefer `--typo-*` directly.",
          "",
          "## Line-height and weight guidance",
          "- Display / H1: `--typo-lh-display ≈ 1.1`, weight 700–600.",
          "- H2 / H3 / H4: `--typo-lh-heading ≈ 1.2–1.25`, weight 600.",
          "- Body / BodySm: `--typo-lh-body ≈ 1.5–1.6`, weight 400.",
          "- Caption: `--typo-lh-caption ≈ 1.4–1.6`, weight 400.",
          "- Mono labels (meta): `--typo-lh-label ≈ 1.0–1.4`, weight 500–600.",
          "",
          "## Behavior contracts (spec-level)",
          "- Numeric data: use distinct dialects for threshold metrics (latency), quota metrics (traffic vs plan), and sequential/clock values (uptime). All should use mono + `font-variant-numeric: tabular-nums`.",
          "- Truncation: headings and labels have explicit max-lines and truncation rules; numeric display values should never truncate.",
          "- Prose: long body copy should respect a `--typo-prose-max-width` (~65ch) on wide surfaces while remaining unconstrained in the miniapp viewport.",
          "- Tone: color reactivity for live data (healthy/advisory/critical) is applied via `data-typo-tone` attributes, not hardcoded color tokens inside components.",
          "- Internationalization: font stacks must cover CJK and extended Latin; tracking-heavy label treatments should be relaxed for RTL scripts.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Reference: Story = {
  render: () => (
    <StoryPage
      eyebrow="Foundations"
      title="Typography system"
      summary="Typography in the miniapp is tuned for narrow, high-density screens: bold headings for quick scanning, restrained body sizes for compact cards, and monospace metadata for system signals and configs."
      stats={[
        { label: "Typography tokens", value: String(typographySpecs.length) },
        { label: "Families", value: "2" },
        { label: "Examples", value: "4" },
      ]}
    >
      <StorySection
        title="Token reference"
        description="Every exported typography token is listed here with its semantic role and a live preview."
      >
        <TokenTable specs={typographySpecs} />
      </StorySection>

      <StorySection
        title="Scale in use"
        description="The same scale has to work for hero metrics, cards, forms, and operational data without collapsing readability."
      >
        <ThreeColumn>
          <StoryCard title="Hero hierarchy" caption="Display and H1 sizes drive first-read orientation on critical status screens.">
            <div style={{ display: "grid", gap: "var(--spacing-2)" }}>
              <div style={displayStyle}>127 ms</div>
              <div style={h1Style}>Connected to Amsterdam</div>
              <div style={bodySmMutedStyle}>Traffic protected via fastest available node.</div>
            </div>
          </StoryCard>
          <StoryCard title="Card hierarchy" caption="H3, body-sm, and caption sizes keep cards compact and legible.">
            <div style={cardExampleStyle}>
              <div style={h3Style}>Pro plan</div>
              <div style={bodySmStyle}>Unlimited devices and priority routing.</div>
              <div style={captionStyle}>Renews March 15, 2026</div>
            </div>
          </StoryCard>
          <StoryCard title="Operational data" caption="Mono labels and values support configuration and diagnostics.">
            <div style={opsExampleStyle}>
              <div>
                <div style={metaStyle}>Endpoint</div>
                <div style={fontMonoValueStyle}>nl-ams-03.vpn-suite.net</div>
              </div>
              <div>
                <div style={metaStyle}>Handshake</div>
                <div style={fontMonoValueStyle}>14m ago</div>
              </div>
            </div>
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Numeric dialects and truncation"
        description="Numeric values, status phrases, and body copy each follow a different reading pattern. This section documents how they should behave before individual components style them."
      >
        <TwoColumn>
          <UsageExample
            title="Numeric dialects"
            description="Latency (threshold), quota (against a plan), and clocks (sequential) all use mono, but with different sizes and behaviors."
          >
            <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
              <div>
                <div style={metaStyle}>Threshold metric</div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--typo-display-size)",
                    lineHeight: 1,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                  data-typo-tone="critical"
                >
                  1840.50 <span className="typography-story-display-unit">MS</span>
                </div>
              </div>
              <div>
                <div style={metaStyle}>Quota metric</div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--typo-h2-size)",
                    lineHeight: 1.1,
                    fontWeight: 500,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  124.8 <span className="typography-story-display-unit">GB</span>
                </div>
              </div>
              <div>
                <div style={metaStyle}>Clock / uptime</div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--typo-body-size)",
                    lineHeight: 1,
                    fontWeight: 400,
                    fontVariantNumeric: "tabular-nums slashed-zero",
                    letterSpacing: "0.04em",
                  }}
                >
                  03:42:18
                </div>
              </div>
            </div>
          </UsageExample>
          <UsageExample
            title="Truncation and line length"
            description="Headings and labels have explicit truncation rules; body copy uses a prose max-width on wide canvases."
          >
            <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
              <div>
                <div style={metaStyle}>H1 (1 line, ellipsis)</div>
                <div
                  style={{
                    ...h1Style,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "260px",
                  }}
                >
                  United Kingdom · London Datacenter #12
                </div>
              </div>
              <div>
                <div style={metaStyle}>H2 (2 lines, then truncate)</div>
                <div
                  style={{
                    ...h2Style,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    maxWidth: "260px",
                  }}
                >
                  Business Annual Unlimited Seats (5 Users, Priority Region Access)
                </div>
              </div>
              <div>
                <div style={metaStyle}>Body (prose max-width)</div>
                <p
                  style={{
                    ...bodyStyle,
                    maxWidth: "65ch",
                    margin: 0,
                  }}
                >
                  We could not retrieve your subscription state. Try again or contact support at
                  support@vpn-suite.io with your account ID: AWG-2024-XXXX-YYYY.
                </p>
              </div>
            </div>
          </UsageExample>
        </TwoColumn>
      </StorySection>

      <StorySection
        title="Do and don't"
        description="Use tokenized typography and semantic tone hooks. Raw font values and hardcoded critical colors are outside the foundations contract."
      >
        <div style={doDontTableStyle}>
          {[
            { good: "font-size: var(--typo-body-size)", bad: "font-size: 14px" },
            { good: "font-family: var(--font-mono)", bad: "font-family: 'IBM Plex Mono'" },
            { good: 'data-typo-tone="critical"', bad: "color: #dc2626" },
            { good: "line-height: var(--typo-lh-body)", bad: "line-height: 1.5" },
          ].map((row) => (
            <div key={row.good} style={doDontRowStyle}>
              <div style={doCellStyle}>
                <span style={doLabelStyle}>Do</span>
                <code style={exampleCodeStyle}>{row.good}</code>
              </div>
              <div style={dontCellStyle}>
                <span style={dontLabelStyle}>Don&apos;t</span>
                <code style={exampleCodeStyle}>{row.bad}</code>
              </div>
            </div>
          ))}
        </div>
      </StorySection>

      <StorySection
        title="Typography in production"
        description="This connects the foundations layer back to a real route pattern so reviewers can navigate from token guidance to product UI."
      >
        <TwoColumn>
          <UsageExample title="Home hero panel" description="Hero typography mixes headline, metadata, and live status values in one surface.">
            <HomeHeroPanel
              variant="degraded"
              statusText="Tunnel active"
              statusHint="Traffic is protected, but latency is elevated and route quality is degraded."
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
          </UsageExample>
          <StoryCard title="Token callouts" caption="Use these callouts when reviewing hero typography regressions.">
            <div style={calloutListStyle}>
              <div style={calloutItemStyle}>
                <code style={calloutTokenStyle}>--typo-h1-size</code>
                <span style={bodySmStyle}>Primary connection headline</span>
              </div>
              <div style={calloutItemStyle}>
                <code style={calloutTokenStyle}>--typo-display-size</code>
                <span style={bodySmStyle}>High-emphasis latency or summary metric value</span>
              </div>
              <div style={calloutItemStyle}>
                <code style={calloutTokenStyle}>--typo-meta-size</code>
                <span style={bodySmStyle}>Uppercase support labels and telemetry metadata</span>
              </div>
              <div style={calloutItemStyle}>
                <code style={calloutTokenStyle}>data-typo-tone</code>
                <span style={bodySmStyle}>Threshold-driven color changes for degraded or critical data</span>
              </div>
            </div>
          </StoryCard>
        </TwoColumn>
      </StorySection>

      <StorySection
        title="Miniapp use cases"
        description="These examples show typography as a communication tool, not just a style layer."
      >
        <TwoColumn>
          <UsageExample title="Checkout summary" description="Semibold headlines guide the decision, while captions keep billing details present but secondary.">
            <div style={checkoutCardStyle}>
              <div style={h2Style}>Choose your plan</div>
              <div style={bodyStyle}>Pro keeps every device protected with a single subscription.</div>
              <div style={checkoutPriceStyle}>$9.99/month</div>
              <div style={captionStyle}>Taxes included where required.</div>
            </div>
          </UsageExample>

          <UsageExample title="Form guidance" description="Meta labels, body copy, and caption text separate task, instruction, and edge-case guidance.">
            <div style={formCardStyle}>
              <label style={metaStyle}>Device name</label>
              <div style={formFieldStyle}>MacBook Air</div>
              <div style={bodySmStyle}>Used to identify the profile in your device list.</div>
              <div style={captionStyle}>Shown only to you inside the miniapp.</div>
            </div>
          </UsageExample>
        </TwoColumn>
      </StorySection>
    </StoryPage>
  ),
};

function PreviewText({ children, style }: { children: string; style: CSSProperties }) {
  return <span style={style}>{children}</span>;
}

function PreviewCell({
  primary,
  spec,
}: {
  primary: React.ReactNode;
  spec: string;
}) {
  return (
    <>
      <span>{primary}</span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--typo-caption-size)",
          lineHeight: 1.4,
          color: "var(--color-text-tertiary)",
        }}
      >
        {spec}
      </span>
    </>
  );
}

const fontSansStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-size)",
  lineHeight: 1.4,
} as const;

const fontMonoStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.4,
  color: "var(--color-text)",
} as const;

const displayStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-display-size)",
  lineHeight: 1,
  fontWeight: 600,
} as const;

const h1Style = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h1-size)",
  lineHeight: 1.1,
  fontWeight: 600,
} as const;

const h2Style = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h2-size)",
  lineHeight: 1.2,
  fontWeight: 600,
} as const;

const h3Style = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h3-size)",
  lineHeight: 1.25,
  fontWeight: 600,
} as const;

const h4Style = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-h4-size)",
  lineHeight: 1.3,
  fontWeight: 600,
} as const;

const bodyStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-size)",
  lineHeight: 1.6,
  fontWeight: 400,
} as const;

const bodySmStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-sm-size)",
  lineHeight: 1.55,
  fontWeight: 400,
} as const;

const bodySmMutedStyle = {
  ...bodySmStyle,
  color: "var(--color-text-muted)",
} as const;

const captionStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.6,
  color: "var(--color-text-muted)",
} as const;

const metaStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-meta-size)",
  lineHeight: 1.4,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--color-text-tertiary)",
} as const;

const pageTitleStyle = {
  ...h1Style,
} as const;

const sectionTitlePreviewStyle = {
  ...h2Style,
} as const;

const cardTitlePreviewStyle = {
  ...h3Style,
} as const;

const cardExampleStyle = {
  display: "grid",
  gap: "var(--spacing-2)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border-subtle)",
} as const;

const opsExampleStyle = {
  display: "grid",
  gap: "var(--spacing-4)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border-subtle)",
} as const;

const fontMonoValueStyle = {
  marginTop: "var(--spacing-1)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-body-sm-size)",
  lineHeight: 1.5,
  color: "var(--color-accent)",
} as const;

const checkoutCardStyle = {
  display: "grid",
  gap: "var(--spacing-3)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
} as const;

const checkoutPriceStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-h2-size)",
  lineHeight: 1.1,
  color: "var(--color-accent)",
} as const;

const formCardStyle = {
  display: "grid",
  gap: "var(--spacing-2)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
} as const;

const formFieldStyle = {
  padding: "var(--spacing-3) var(--spacing-4)",
  borderRadius: "var(--radius-md)",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border-subtle)",
  color: "var(--color-text)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--typo-body-sm-size)",
} as const;

const doDontTableStyle = {
  display: "grid",
  gap: "var(--spacing-3)",
} as const;

const doDontRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "var(--spacing-3)",
} as const;

const doCellStyle = {
  display: "grid",
  gap: "var(--spacing-2)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--green-b)",
  background: "color-mix(in oklch, var(--color-surface) 94%, var(--green-d) 6%)",
} as const;

const dontCellStyle = {
  display: "grid",
  gap: "var(--spacing-2)",
  padding: "var(--spacing-4)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--red-b)",
  background: "color-mix(in oklch, var(--color-surface) 94%, var(--red-d) 6%)",
} as const;

const doLabelStyle = {
  ...metaStyle,
  color: "var(--color-success)",
} as const;

const dontLabelStyle = {
  ...metaStyle,
  color: "var(--color-error)",
} as const;

const exampleCodeStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.6,
  color: "var(--color-text)",
} as const;

const calloutListStyle = {
  display: "grid",
  gap: "var(--spacing-3)",
} as const;

const calloutItemStyle = {
  display: "grid",
  gap: "var(--spacing-1)",
  padding: "var(--spacing-3)",
  borderRadius: "var(--radius-md)",
  background: "color-mix(in oklch, var(--color-surface) 92%, var(--color-surface-2) 8%)",
} as const;

const calloutTokenStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--typo-caption-size)",
  lineHeight: 1.4,
  color: "var(--color-accent)",
} as const;

const typographySpecs = [
  {
    name: "Font Sans",
    token: TYPOGRAPHY_TOKENS.fontSans,
    usage: "Primary UI font for titles, body text, and buttons.",
    family: "Space Grotesk",
    value: "Space Grotesk",
    mobileValue: "UI sans family",
    preview: <PreviewText style={fontSansStyle}>Space Grotesk</PreviewText>,
  },
  {
    name: "Font Mono",
    token: TYPOGRAPHY_TOKENS.fontMono,
    usage: "Operational data, metadata, and config snippets.",
    family: "IBM Plex Mono",
    value: "IBM Plex Mono",
    mobileValue: "Mono for config & metrics",
    preview: <PreviewText style={fontMonoStyle}>IBM Plex Mono</PreviewText>,
  },
  {
    name: "Page title size",
    token: TYPOGRAPHY_TOKENS.fontPageTitleSize,
    usage: "Top-level page header sizing (aliased to H1).",
    value: "22px",
    mobileValue: "22px (mobile shell max 420px)",
    lineHeight: "≈ 1.2",
    weight: "600",
    family: "Space Grotesk",
    note: "Alias: --ds-font-page-title-size → --typo-h1-size.",
    preview: (
      <PreviewCell
        primary={<PreviewText style={pageTitleStyle}>Devices</PreviewText>}
        spec="22px · 600 · Space Grotesk · lh ≈ 1.2"
      />
    ),
  },
  {
    name: "Section title size",
    token: TYPOGRAPHY_TOKENS.fontSectionTitleSize,
    usage: "Section heading sizing (aliased to H2).",
    value: "18px",
    mobileValue: "18px",
    lineHeight: "≈ 1.2",
    weight: "600",
    family: "Space Grotesk",
    note: "Alias: --ds-font-section-title-size → --typo-h2-size.",
    preview: (
      <PreviewCell
        primary={<PreviewText style={sectionTitlePreviewStyle}>Quick actions</PreviewText>}
        spec="18px · 600 · Space Grotesk · lh ≈ 1.2"
      />
    ),
  },
  {
    name: "Card title size",
    token: TYPOGRAPHY_TOKENS.fontCardTitleSize,
    usage: "Card title and hero title sizing (aliased to H3).",
    value: "16px",
    mobileValue: "16px",
    lineHeight: "≈ 1.25",
    weight: "600",
    family: "Space Grotesk",
    note: "Alias: --ds-font-card-title-size → --typo-h3-size.",
    preview: (
      <PreviewCell
        primary={<PreviewText style={cardTitlePreviewStyle}>Fastest node</PreviewText>}
        spec="16px · 600 · Space Grotesk · lh ≈ 1.25"
      />
    ),
  },
  {
    name: "Body size (alias)",
    token: TYPOGRAPHY_TOKENS.fontBodySize,
    usage: "Default supporting copy (aliased to typo-body-sm).",
    value: "14px",
    mobileValue: "14px",
    lineHeight: "≈ 1.6",
    weight: "400",
    family: "Space Grotesk",
    note: "Alias: --ds-font-body-size → --typo-body-sm-size.",
    preview: (
      <PreviewCell
        primary={<PreviewText style={bodyStyle}>Body copy</PreviewText>}
        spec="14px · 400 · Space Grotesk · lh ≈ 1.6"
      />
    ),
  },
  {
    name: "Caption size (alias)",
    token: TYPOGRAPHY_TOKENS.fontCaptionSize,
    usage: "Hints, dates, and low-emphasis support text (aliased to typo-caption).",
    value: "12px",
    mobileValue: "12px",
    lineHeight: "≈ 1.5–1.6",
    weight: "400",
    family: "Space Grotesk",
    note: "Alias: --ds-font-caption-size → --typo-caption-size.",
    preview: (
      <PreviewCell
        primary={<PreviewText style={captionStyle}>Caption copy</PreviewText>}
        spec="12px · 400 · Space Grotesk · lh ≈ 1.5–1.6"
      />
    ),
  },
  {
    name: "Label size (alias)",
    token: TYPOGRAPHY_TOKENS.fontLabelSize,
    usage: "Field labels and metadata tags (aliased to typo-meta).",
    value: "12px (meta, uppercase)",
    mobileValue: "12px (avoid going smaller)",
    lineHeight: "≈ 1.0–1.4",
    weight: "500–600",
    family: "IBM Plex Mono",
    note: "Alias: --ds-font-label-size → --typo-meta-size. Prefer high contrast for WCAG AA.",
    preview: (
      <div style={{ display: "grid", gap: 2, alignItems: "flex-end" }}>
        <PreviewCell
          primary={<PreviewText style={metaStyle}>LABEL</PreviewText>}
          spec="12px · 600 · IBM Plex Mono · lh ≈ 1.2 · current color"
        />
        <span
          style={{
            ...metaStyle,
            color: "rgba(0, 0, 0, 0.6)",
          }}
        >
          LABEL
        </span>
      </div>
    ),
  },
  {
    name: "Display size",
    token: TYPOGRAPHY_TOKENS.typoDisplaySize,
    usage: "Highest-emphasis metric or hero heading.",
    value: "32px",
    mobileValue: "28–32px (hero blocks)",
    lineHeight: "≈ 1.1",
    weight: "600–700",
    family: "Space Grotesk",
    preview: (
      <PreviewCell
        primary={<PreviewText style={displayStyle}>Secure tunnel active</PreviewText>}
        spec="32px · 600 · Space Grotesk · lh ≈ 1.1"
      />
    ),
  },
  {
    name: "H1 size",
    token: TYPOGRAPHY_TOKENS.typoH1Size,
    usage: "Primary page hero heading.",
    value: "24px",
    mobileValue: "24px",
    lineHeight: "≈ 1.1",
    weight: "600",
    family: "Space Grotesk",
    preview: (
      <PreviewCell
        primary={<PreviewText style={h1Style}>Connected</PreviewText>}
        spec="24px · 600 · Space Grotesk · lh ≈ 1.1"
      />
    ),
  },
  {
    name: "H2 size",
    token: TYPOGRAPHY_TOKENS.typoH2Size,
    usage: "Section headline and key metric title.",
    value: "18px",
    mobileValue: "18px",
    lineHeight: "≈ 1.2",
    weight: "600",
    family: "Space Grotesk",
    preview: (
      <PreviewCell
        primary={<PreviewText style={h2Style}>Choose server</PreviewText>}
        spec="18px · 600 · Space Grotesk · lh ≈ 1.2"
      />
    ),
  },
  {
    name: "H3 size",
    token: TYPOGRAPHY_TOKENS.typoH3Size,
    usage: "Card headline and grouped content title.",
    value: "16px",
    mobileValue: "15–16px",
    lineHeight: "≈ 1.25",
    weight: "600",
    family: "Space Grotesk",
    preview: (
      <PreviewCell
        primary={<PreviewText style={h3Style}>Your plan</PreviewText>}
        spec="16px · 600 · Space Grotesk · lh ≈ 1.25"
      />
    ),
  },
  {
    name: "H4 size",
    token: TYPOGRAPHY_TOKENS.typoH4Size,
    usage: "Compact emphasis heading.",
    value: "15px",
    mobileValue: "15px",
    lineHeight: "≈ 1.3",
    weight: "600",
    family: "Space Grotesk",
    preview: (
      <PreviewCell
        primary={<PreviewText style={h4Style}>Recent devices</PreviewText>}
        spec="15px · 600 · Space Grotesk · lh ≈ 1.3"
      />
    ),
  },
  {
    name: "Body size",
    token: TYPOGRAPHY_TOKENS.typoBodySize,
    usage: "Core reading size in product content.",
    value: "14px",
    mobileValue: "14px",
    lineHeight: "≈ 1.6",
    weight: "400",
    family: "Space Grotesk",
    preview: (
      <PreviewCell
        primary={<PreviewText style={bodyStyle}>Standard body</PreviewText>}
        spec="14px · 400 · Space Grotesk · lh ≈ 1.6"
      />
    ),
  },
  {
    name: "Body sm size",
    token: TYPOGRAPHY_TOKENS.typoBodySmSize,
    usage: "Dense cards and list content.",
    value: "14px",
    mobileValue: "14px",
    lineHeight: "≈ 1.55",
    weight: "400",
    family: "Space Grotesk",
    preview: (
      <PreviewCell
        primary={<PreviewText style={bodySmStyle}>Compact body</PreviewText>}
        spec="14px · 400 · Space Grotesk · lh ≈ 1.55"
      />
    ),
  },
  {
    name: "Caption size",
    token: TYPOGRAPHY_TOKENS.typoCaptionSize,
    usage: "Supportive copy and timestamps.",
    value: "12px",
    mobileValue: "12px",
    lineHeight: "≈ 1.5–1.6",
    weight: "400",
    family: "Space Grotesk",
    preview: (
      <PreviewCell
        primary={<PreviewText style={captionStyle}>Updated 2m ago</PreviewText>}
        spec="12px · 400 · Space Grotesk · lh ≈ 1.5–1.6"
      />
    ),
  },
  {
    name: "Meta size",
    token: TYPOGRAPHY_TOKENS.typoMetaSize,
    usage: "Uppercase labels and technical metadata.",
    value: "12px (uppercase mono)",
    mobileValue: "12px",
    lineHeight: "≈ 1.2–1.4",
    weight: "600",
    family: "IBM Plex Mono",
    preview: (
      <PreviewCell
        primary={<PreviewText style={metaStyle}>STATUS</PreviewText>}
        spec="12px · 600 · IBM Plex Mono · lh ≈ 1.2–1.4"
      />
    ),
  },
  {
    name: "Weight regular",
    token: TYPOGRAPHY_TOKENS.fontWeightRegular,
    usage: "Base reading weight for body and caption text.",
    value: "400",
    mobileValue: "Body / Caption",
    preview: (
      <PreviewCell
        primary={<PreviewText style={bodyStyle}>Regular weight</PreviewText>}
        spec="400 · Space Grotesk"
      />
    ),
  },
  {
    name: "Weight semibold",
    token: TYPOGRAPHY_TOKENS.fontWeightSemibold,
    usage: "Heading and action emphasis.",
    value: "600",
    mobileValue: "Headings / buttons",
    preview: (
      <PreviewCell
        primary={<PreviewText style={{ ...bodyStyle, fontWeight: 600 }}>Semibold weight</PreviewText>}
        spec="600 · Space Grotesk"
      />
    ),
  },
];
