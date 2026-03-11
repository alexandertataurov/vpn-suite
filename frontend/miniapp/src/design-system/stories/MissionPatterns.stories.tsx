import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import {
  MissionAlert,
  MissionCard,
  MissionChip,
  MissionModuleHead,
  MissionPrimaryAnchor,
  MissionOperationArticle,
  MissionOperationButton,
  MissionOperationLink,
  MissionPrimaryButton,
  MissionPrimaryLink,
  MissionProgressBar,
  MissionSecondaryAnchor,
  MissionSecondaryButton,
  MissionSecondaryLink,
  MissionStatusDot,
} from "../patterns";
import { StoryPage, StorySection, TwoColumn, UsageExample, ValuePill } from "./foundations.story-helpers";

const meta = {
  title: "Patterns/Mission",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Mission patterns are the core card, alert, action, and status language used across the miniapp's operational surfaces.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function MissionStoryFrame({ children }: { children: React.ReactNode }) {
  return <MemoryRouter><div style={{ display: "grid", gap: "var(--spacing-4)", maxWidth: 520 }}>{children}</div></MemoryRouter>;
}

function MissionPatternBlock({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: "var(--spacing-3)", alignContent: "start", minHeight: 0 }}>
      <div style={{ display: "grid", gap: "var(--spacing-2)" }}>
        <h3 style={{ margin: 0, fontSize: "var(--typo-h3-size)", lineHeight: 1.25, fontWeight: 600 }}>{title}</h3>
        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--typo-caption-size)", lineHeight: 1.6 }}>{caption}</p>
      </div>
      {children}
    </div>
  );
}

export const Default: Story = {
  tags: ["chromatic"],
  render: () => (
    <MemoryRouter>
      <StoryPage
        eyebrow="Patterns"
        title="Mission patterns"
        summary="Mission patterns package the miniapp's opinionated status language into reusable cards, alerts, actions, and progress surfaces. This page documents the family as a system instead of isolated fragments."
        stats={[
          { label: "Pattern groups", value: "6" },
          { label: "Tones", value: "blue/green/amber/red" },
          { label: "Showcases", value: "4" },
        ]}
      >
        <StorySection
          title="Card and signal language"
          description="MissionCard, MissionChip, MissionModuleHead, MissionAlert, MissionStatusDot, and MissionProgressBar form the base visual system."
        >
          <div style={{ display: "grid", gap: "var(--spacing-4)", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", alignItems: "start" }}>
            <MissionPatternBlock title="Mission card" caption="Render directly on the page background so the card's own edge tone and surface treatment carry the state.">
              <MissionCard tone="green" glowTone="green">
                <MissionModuleHead label="Connection" chip={<MissionChip tone="green">Healthy</MissionChip>} />
                <div className="dc-key">Status</div>
                <div className="dc-val green">Protected traffic</div>
              </MissionCard>
            </MissionPatternBlock>
            <MissionPatternBlock title="Mission alert" caption="Alert tone should come from the left edge and button family, not from an over-saturated background wash.">
              <MissionAlert
                tone="warning"
                title="Subscription"
                message="Your plan ends in 3 days. Renew to avoid interruption."
                actions={<MissionSecondaryLink to="/plan" className="mission-alert-action--warning">Renew now</MissionSecondaryLink>}
              />
            </MissionPatternBlock>
            <MissionPatternBlock title="Progress and status" caption="Status dots and progress bars should stay legible without extra wrapper chrome.">
              <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MissionStatusDot tone="connecting" />
                  <span style={{ fontSize: 13, color: "var(--color-warning)", letterSpacing: "0.04em" }}>Connecting</span>
                </div>
                <MissionProgressBar percent={68} tone="warning" />
              </div>
            </MissionPatternBlock>
          </div>
        </StorySection>

        <StorySection
          title="Action patterns"
          description="Mission buttons, links, anchors, and operation rows encode the miniapp's primary navigation and recovery behavior."
        >
          <TwoColumn>
            <UsageExample title="Full-width stack" description="Use a single-column stack when a primary action and its secondary support route share the same width rule.">
              <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
                <MissionPrimaryButton className="mission-story-btn">Connect now</MissionPrimaryButton>
                <MissionSecondaryButton className="mission-story-btn">Open support</MissionSecondaryButton>
                <MissionPrimaryAnchor href="https://example.com/download" className="mission-story-btn">Download config</MissionPrimaryAnchor>
                <MissionSecondaryAnchor href="https://example.com/docs" className="mission-story-btn">Open docs</MissionSecondaryAnchor>
              </div>
            </UsageExample>
            <UsageExample title="Inline pair + operation rows" description="Use side-by-side pairs only for deliberate deferral patterns, and keep operation-row tone driven by the row prop rather than hardcoded link styling.">
              <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "var(--spacing-2)", alignItems: "stretch" }}>
                  <MissionPrimaryButton tone="warning" className="mission-story-btn">Renew now</MissionPrimaryButton>
                  <MissionSecondaryButton className="mission-story-btn mission-story-btn--secondary">Maybe later</MissionSecondaryButton>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  <MissionOperationButton
                    tone="blue"
                    icon="↻"
                    title="Refresh config"
                    description="Generate a new device profile"
                  />
                  <MissionOperationLink
                    to="/servers"
                    tone="blue"
                    icon="◎"
                    title="Change server"
                    description="Pick a different route and location"
                  />
                  <MissionOperationArticle
                    tone="green"
                    icon="✓"
                    title="Tunnel healthy"
                    description="No action needed right now"
                    trailing={<ValuePill value="Stable" tone="success" />}
                  />
                </div>
              </div>
            </UsageExample>
          </TwoColumn>
        </StorySection>
      </StoryPage>
    </MemoryRouter>
  ),
};

export const CardLanguage: Story = {
  tags: ["chromatic"],
  render: () => (
    <MissionStoryFrame>
      <MissionCard tone="green" glowTone="green">
        <MissionModuleHead label="Connection" chip={<MissionChip tone="green">Healthy</MissionChip>} />
        <div className="dc-key">Status</div>
        <div className="dc-val green">Protected traffic</div>
      </MissionCard>
      <MissionCard tone="amber" glowTone="amber">
        <MissionModuleHead label="Recovery" chip={<MissionChip tone="amber">Attention</MissionChip>} />
        <div className="dc-key">State</div>
        <div className="dc-val amber">Route degraded</div>
      </MissionCard>
    </MissionStoryFrame>
  ),
};

export const AlertStates: Story = {
  tags: ["chromatic"],
  render: () => (
    <MissionStoryFrame>
      <MissionAlert tone="info" title="Info" message="Device config is ready for import." />
      <MissionAlert tone="warning" title="Subscription" message="Your plan ends in 3 days. Renew to avoid interruption." actions={<MissionSecondaryLink to="/plan" className="mission-alert-action--warning">Renew now</MissionSecondaryLink>} />
      <MissionAlert tone="error" title="Connection" message="Secure tunnel failed. Retry after checking logs." actions={<MissionPrimaryLink to="/support/logs">View logs</MissionPrimaryLink>} />
      <MissionAlert tone="success" title="Healthy" message="Tunnel metrics are stable and no action is required." />
    </MissionStoryFrame>
  ),
};

export const ActionPatterns: Story = {
  render: () => (
    <MissionStoryFrame>
      <div style={{ display: "grid", gap: 8 }}>
        <MissionPrimaryButton className="mission-story-btn">Connect now</MissionPrimaryButton>
        <MissionSecondaryButton className="mission-story-btn">Open support</MissionSecondaryButton>
        <MissionPrimaryAnchor href="https://example.com/download" className="mission-story-btn">Download config</MissionPrimaryAnchor>
        <MissionSecondaryAnchor href="https://example.com/docs" className="mission-story-btn">Open docs</MissionSecondaryAnchor>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "var(--spacing-2)", alignItems: "stretch" }}>
        <MissionPrimaryButton tone="warning" className="mission-story-btn">Renew now</MissionPrimaryButton>
        <MissionSecondaryButton className="mission-story-btn mission-story-btn--secondary">Maybe later</MissionSecondaryButton>
      </div>
    </MissionStoryFrame>
  ),
};

export const OperationSurfaces: Story = {
  render: () => (
    <MissionStoryFrame>
      <div style={{ display: "grid", gap: 12 }}>
      <MissionOperationButton
        tone="blue"
        icon="↻"
        title="Refresh config"
        description="Generate a new device profile"
      />
      <MissionOperationLink
        to="/servers"
        tone="blue"
        icon="◎"
        title="Change server"
        description="Pick a different route and location"
      />
      <MissionOperationArticle
        tone="green"
        icon="✓"
        title="Tunnel healthy"
        description="No action needed right now"
        trailing={<ValuePill value="Stable" tone="success" />}
      />
      </div>
    </MissionStoryFrame>
  ),
};
