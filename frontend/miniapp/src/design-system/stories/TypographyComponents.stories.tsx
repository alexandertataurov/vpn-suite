import type { Meta, StoryObj } from "@storybook/react";
import { Body, Caption, Display, H1, H2, H3 } from "../components/typography";
import { Stack } from "../primitives";
import { StoryCard, StoryPage, StorySection, ThreeColumn, TwoColumn, UsageExample } from "./foundations.story-helpers";

const meta = {
  title: "Primitives/Typography",
  tags: ["autodocs"],
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    chromatic: { viewports: [390] },
    docs: {
      description: {
        component:
          "Semantic typography components for the miniapp. The mobile contract favors tighter hero rhythm, smaller display scale, tabular metrics, urgency-aware captions, and predictable long-string wrapping.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StoryPage
      eyebrow="Components"
      title="Typography components"
      summary="These semantic wrappers now document the actual mobile hierarchy: smaller hero scale, tighter rhythm, data-first metric formatting, urgency-aware captions, and resilient long-string behavior."
      stats={[
        { label: "Mobile display", value: "28px" },
        { label: "Dark snapshot", value: "yes" },
        { label: "Overflow states", value: "yes" },
      ]}
    >
      <StorySection
        title="Semantic scale"
        description="Display remains the primary status headline, H1 becomes the supporting page title, and H2/H3 separate section and card hierarchy more clearly on mobile."
      >
        <ThreeColumn>
          <StoryCard title="Hero scale" caption="The hero block should orient the user without consuming the first viewport.">
            <div className="typography-story-mobile-frame typography-story-hero">
              <Display className="typography-story-display">Secure tunnel active</Display>
              <H1 className="typography-story-location">Amsterdam, NL</H1>
              <Caption>Last refreshed 2 minutes ago</Caption>
            </div>
          </StoryCard>
          <StoryCard title="Section scale" caption="H2 now leads sections, while H3 sits clearly below it as card or item copy.">
            <Stack gap="2" className="typography-story-mobile-frame">
              <H2>Plan options</H2>
              <H3>Pro monthly</H3>
              <Body>Unlimited devices with priority routing.</Body>
            </Stack>
          </StoryCard>
          <StoryCard title="Operational values" caption="Units shrink, prose stays sans-serif, and urgency moves into the caption instead of the whole line.">
            <div className="typography-story-mobile-frame typography-story-metric-stack">
              <Display tabular className="typography-story-display">
                <span className="typography-story-display-value">127.40</span>
                <span className="typography-story-display-unit">MS</span>
              </Display>
              <div className="typography-story-metric-row">
                <Caption>Traffic</Caption>
                <H2 tabular>
                  124.8
                  <span className="typography-story-display-unit">GB</span>
                </H2>
              </div>
              <Caption tabular urgency="warning">
                Renews in 03 days
              </Caption>
            </div>
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Miniapp usage"
        description="Typography components should be validated inside real mobile-width product blocks instead of standalone specimen lines."
      >
        <TwoColumn>
          <UsageExample title="Connection summary" description="Latency keeps its data hierarchy while the location and protocol remain secondary.">
            <div className="typography-story-mobile-frame typography-story-metric-stack">
              <Display tabular className={`typography-story-display ${latencyToneClass(99.99)}`}>
                <span className="typography-story-display-value">99.99</span>
                <span className="typography-story-display-unit">MS</span>
              </Display>
              <H2>Connected to Frankfurt</H2>
              <Caption>Protected over AmneziaWG</Caption>
            </div>
          </UsageExample>
          <UsageExample title="Plan card copy" description="Plan summaries should read as one compact unit, not three disconnected blocks.">
            <div className="typography-story-mobile-frame typography-story-plan-copy">
              <H3>Pro plan</H3>
              <Body>Unlimited devices, 1 TB included traffic, priority nodes.</Body>
              <Caption>Billed monthly</Caption>
            </div>
          </UsageExample>
        </TwoColumn>
      </StorySection>

      <StorySection
        title="Theme and overflow"
        description="Typography needs to hold up on the dark runtime theme and with long production strings, not just short light-theme copy."
      >
        <TwoColumn>
          <UsageExample title="Dark theme" description="A dark snapshot catches legibility regressions that a light-only story hides.">
            <div className="typography-story-dark-frame typography-story-metric-stack">
              <Display className="typography-story-display">Secure tunnel active</Display>
              <H1>Amsterdam, NL</H1>
              <Caption>Last refreshed 2 minutes ago</Caption>
              <Caption urgency="warning">Renews in 02 days</Caption>
            </div>
          </UsageExample>
          <UsageExample title="Long strings" description="Long locations, plans, and wider metrics must wrap cleanly on 375px to 390px screens.">
            <div className="typography-story-mobile-frame typography-story-metric-stack">
              <Display tabular className="typography-story-display typography-story-display--critical">
                <span className="typography-story-display-value">1840.50</span>
                <span className="typography-story-display-unit">MS</span>
              </Display>
              <H1>United Kingdom · London Datacenter #12</H1>
              <H2>Business Annual Unlimited Seats</H2>
              <Body>Unlimited devices, 1 TB included traffic, priority nodes, dedicated support.</Body>
              <Caption urgency="critical">Renews in 00 days</Caption>
            </div>
          </UsageExample>
        </TwoColumn>
      </StorySection>
    </StoryPage>
  ),
};

export const Scale: Story = {
  render: () => (
    <div className="typography-story-mobile-frame">
      <Stack gap="2">
        <Display>Secure tunnel active</Display>
        <H1>Amsterdam, NL</H1>
        <H2>Plan options</H2>
        <H3>Pro monthly</H3>
        <Body>Unlimited devices with priority routing.</Body>
        <Caption>Last refreshed 2 minutes ago</Caption>
      </Stack>
    </div>
  ),
};

export const TabularNumbers: Story = {
  render: () => (
    <div className="typography-story-mobile-frame typography-story-metric-stack">
      <Display tabular className="typography-story-display">
        <span className="typography-story-display-value">127.40</span>
        <span className="typography-story-display-unit">MS</span>
      </Display>
      <H2 tabular>
        1,024
        <span className="typography-story-display-unit">DEVICES</span>
      </H2>
      <Body>
        Traffic <span className="miniapp-tnum">124.8</span>
        <span className="typography-story-display-unit">GB</span>
      </Body>
      <Caption tabular urgency="elevated">
        Updated 14m ago
      </Caption>
    </div>
  ),
};

export const DarkThemeShowcase: Story = {
  parameters: { chromatic: { viewports: [390] } },
  render: () => (
    <div className="typography-story-dark-frame typography-story-metric-stack">
      <Display className="typography-story-display">Secure tunnel active</Display>
      <H1>Amsterdam, NL</H1>
      <H2>Connection summary</H2>
      <Body>Traffic is protected and routed through a private tunnel.</Body>
      <Caption urgency="warning">Renews in 02 days</Caption>
    </div>
  ),
};

export const LongStrings: Story = {
  parameters: { chromatic: { viewports: [390, 375] } },
  render: () => (
    <div className="typography-story-mobile-frame typography-story-metric-stack">
      <Display tabular className="typography-story-display typography-story-display--critical">
        <span className="typography-story-display-value">1840.50</span>
        <span className="typography-story-display-unit">MS</span>
      </Display>
      <H1>United Kingdom · London Datacenter #12</H1>
      <H2>Business Annual Unlimited Seats</H2>
      <H3>Priority routing with dedicated support</H3>
      <Body>Unlimited devices, 1 TB included traffic, priority nodes, and audited fallback routing across multiple regions.</Body>
      <Caption urgency="critical">Renews in 00 days</Caption>
    </div>
  ),
};

export const StressTest: Story = {
  parameters: { chromatic: { viewports: [375, 390, 430] } },
  render: () => (
    <StoryPage
      eyebrow="Validation"
      title="Typography stress test"
      summary="A single canvas that exercises long strings, numeric thresholds, CJK names, IPv6 values, and truncation rules at common mobile widths."
      stats={[
        { label: "Viewports", value: "3" },
        { label: "Scenarios", value: "6" },
      ]}
    >
      <StorySection
        title="Edge-case snapshot"
        description="Use this story when changing anything in the typography system to catch regressions before they reach product screens."
      >
        <div className="typography-story-mobile-frame typography-story-metric-stack">
          <H1>United Kingdom · London Datacenter #12</H1>
          <Display tabular className="typography-story-display typography-story-display--critical">
            <span className="typography-story-display-value">1840.50</span>
            <span className="typography-story-display-unit">MS</span>
          </Display>
          <H2>Business Annual Unlimited Seats (5 Users)</H2>
          <H3>我的MacBook Air设备</H3>
          <Body>
            We could not retrieve your subscription state. Try again or contact support at support@vpn-suite.io with your
            account ID: AWG-2024-XXXX-YYYY.
          </Body>
          <Body>
            <span className="miniapp-tnum">2001:0db8:85a3:0000:0000:8a2e:0370:7334</span>
          </Body>
          <Caption>Renews in 00 days</Caption>
        </div>
      </StorySection>
    </StoryPage>
  ),
};

function latencyToneClass(latencyMs: number) {
  if (latencyMs >= 500) return "typography-story-display--critical";
  if (latencyMs >= 100) return "typography-story-display--warning";
  return "";
}
