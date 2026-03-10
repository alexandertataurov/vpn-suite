import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react";
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
  title: "Design System/Foundations/Typography",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "Typography foundations cover the miniapp font families, semantic sizing tokens, and content-library type scale.",
          "",
          "## Coverage",
          "This page includes every exported typography token and demonstrates how the scale behaves in real miniapp layouts.",
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

const typographySpecs = [
  { name: "Font Sans", token: TYPOGRAPHY_TOKENS.fontSans, usage: "Primary UI font for titles, body text, and buttons.", preview: <PreviewText style={fontSansStyle}>Space Grotesk</PreviewText> },
  { name: "Font Mono", token: TYPOGRAPHY_TOKENS.fontMono, usage: "Operational data, metadata, and config snippets.", preview: <PreviewText style={fontMonoStyle}>IBM Plex Mono</PreviewText> },
  { name: "Page title size", token: TYPOGRAPHY_TOKENS.fontPageTitleSize, usage: "Top-level page header sizing.", preview: <PreviewText style={pageTitleStyle}>Devices</PreviewText> },
  { name: "Section title size", token: TYPOGRAPHY_TOKENS.fontSectionTitleSize, usage: "Section heading sizing.", preview: <PreviewText style={sectionTitlePreviewStyle}>Quick actions</PreviewText> },
  { name: "Card title size", token: TYPOGRAPHY_TOKENS.fontCardTitleSize, usage: "Card title and hero title sizing.", preview: <PreviewText style={cardTitlePreviewStyle}>Fastest node</PreviewText> },
  { name: "Body size", token: TYPOGRAPHY_TOKENS.fontBodySize, usage: "Default supporting copy.", preview: <PreviewText style={bodyStyle}>Body copy</PreviewText> },
  { name: "Caption size", token: TYPOGRAPHY_TOKENS.fontCaptionSize, usage: "Hints, dates, and low-emphasis support text.", preview: <PreviewText style={captionStyle}>Caption copy</PreviewText> },
  { name: "Label size", token: TYPOGRAPHY_TOKENS.fontLabelSize, usage: "Field labels and metadata tags.", preview: <PreviewText style={metaStyle}>LABEL</PreviewText> },
  { name: "Display size", token: TYPOGRAPHY_TOKENS.typoDisplaySize, usage: "Highest-emphasis metric or hero heading.", preview: <PreviewText style={displayStyle}>32px</PreviewText> },
  { name: "H1 size", token: TYPOGRAPHY_TOKENS.typoH1Size, usage: "Primary page hero heading.", preview: <PreviewText style={h1Style}>Connected</PreviewText> },
  { name: "H2 size", token: TYPOGRAPHY_TOKENS.typoH2Size, usage: "Section headline and key metric title.", preview: <PreviewText style={h2Style}>Choose server</PreviewText> },
  { name: "H3 size", token: TYPOGRAPHY_TOKENS.typoH3Size, usage: "Card headline and grouped content title.", preview: <PreviewText style={h3Style}>Your plan</PreviewText> },
  { name: "H4 size", token: TYPOGRAPHY_TOKENS.typoH4Size, usage: "Compact emphasis heading.", preview: <PreviewText style={h4Style}>Recent devices</PreviewText> },
  { name: "Body size", token: TYPOGRAPHY_TOKENS.typoBodySize, usage: "Core reading size in product content.", preview: <PreviewText style={bodyStyle}>Standard body</PreviewText> },
  { name: "Body sm size", token: TYPOGRAPHY_TOKENS.typoBodySmSize, usage: "Dense cards and list content.", preview: <PreviewText style={bodySmStyle}>Compact body</PreviewText> },
  { name: "Caption size", token: TYPOGRAPHY_TOKENS.typoCaptionSize, usage: "Supportive copy and timestamps.", preview: <PreviewText style={captionStyle}>Updated 2m ago</PreviewText> },
  { name: "Meta size", token: TYPOGRAPHY_TOKENS.typoMetaSize, usage: "Uppercase labels and technical metadata.", preview: <PreviewText style={metaStyle}>STATUS</PreviewText> },
  { name: "Weight regular", token: TYPOGRAPHY_TOKENS.fontWeightRegular, usage: "Base reading weight.", preview: <PreviewText style={bodyStyle}>400</PreviewText> },
  { name: "Weight semibold", token: TYPOGRAPHY_TOKENS.fontWeightSemibold, usage: "Heading and action emphasis.", preview: <PreviewText style={{ ...bodyStyle, fontWeight: 600 }}>600</PreviewText> },
];
