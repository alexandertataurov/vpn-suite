import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/design-system/components/Button";
import {
  EMPTY_STATE_VARIANTS,
  EmptyStateBlock,
  MissionPrimaryButton,
  MissionSecondaryButton,
  OfflineBanner,
  type EmptyStateVariant,
} from "..";
import { FallbackScreen } from "./FallbackScreen";
import { PageStateScreen, type PageStateMode, type PageStateVariant } from "./PageStateScreen";
import {
  StoryCard,
  StoryPage,
  StorySection,
  ThreeColumn,
  TwoColumn,
  UsageExample,
  ValuePill,
} from "@/design-system/utils/story-helpers";

const meta = {
  title: "Patterns/State Surfaces",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Block patterns define the miniapp's empty, offline, and blocking-state surfaces. The stories below document the variant contracts, CTA rules, and overlay behavior that product pages should reuse instead of inventing ad hoc fallbacks.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;
const queryClient = new QueryClient();

type ErrorMapping = {
  code: string;
  scenario: "retryable" | "non_retryable" | "auth_failure" | "timeout";
  variant: PageStateVariant;
  retryable: boolean;
};

const PAGE_STATE_VARIANTS: Array<{
  variant: PageStateVariant;
  mode: PageStateMode;
  label: string;
  chipText: string;
  title: string;
  message: string;
  caption: string;
  actions?: ReactNode;
}> = [
  {
    variant: "attention",
    mode: "overlay",
    label: "Permission",
    chipText: "Attention",
    title: "VPN permission required",
    message: "Grant the secure-tunnel permission before the app can protect traffic.",
    caption: "Overlay prompt for recoverable attention states.",
    actions: <MissionPrimaryButton tone="warning">Continue setup</MissionPrimaryButton>,
  },
  {
    variant: "blocked",
    mode: "replace",
    label: "Authentication",
    chipText: "Blocked",
    title: "Authentication expired",
    message: "Your Telegram session expired and must be restored before subscription data can load.",
    caption: "Full-screen replacement for auth and plan fetch blockers.",
    actions: <MissionPrimaryButton>Resolve</MissionPrimaryButton>,
  },
  {
    variant: "info",
    mode: "inline",
    label: "Network",
    chipText: "Info",
    title: "Network switching in progress",
    message: "The route is being reassessed. Content remains available but live actions may pause.",
    caption: "Inline state for auto-resolving system transitions with optional soft dismissal.",
    actions: <MissionSecondaryButton>Got it</MissionSecondaryButton>,
  },
  {
    variant: "fatal",
    mode: "replace",
    label: "System Error",
    chipText: "Fatal",
    title: "Configuration is no longer valid",
    message: "This session cannot continue safely. Restore access or contact support.",
    caption: "Hard-stop route replacement with stronger destructive framing.",
    actions: <MissionPrimaryButton tone="danger">Restore access</MissionPrimaryButton>,
  },
];

const ERROR_TAXONOMY: ErrorMapping[] = [
  { code: "AUTH_EXPIRED", scenario: "auth_failure", variant: "blocked", retryable: false },
  { code: "NETWORK_TIMEOUT", scenario: "timeout", variant: "attention", retryable: true },
  { code: "ACCOUNT_BANNED", scenario: "non_retryable", variant: "fatal", retryable: false },
  { code: "PLAN_FETCH_FAIL", scenario: "retryable", variant: "blocked", retryable: true },
];

function withQueryClient(children: ReactNode) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function BlockStoryFrame({ children, paddedForBanner = false }: { children: ReactNode; paddedForBanner?: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--spacing-4)",
        maxWidth: 640,
        paddingTop: paddedForBanner ? 56 : 0,
      }}
    >
      {children}
    </div>
  );
}

function BlockingStateGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "var(--spacing-4)",
        alignItems: "stretch",
      }}
    >
      {children}
    </div>
  );
}

function BlockPreviewFrame({
  children,
  minHeight = 240,
}: {
  children: ReactNode;
  minHeight?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        minHeight,
        alignItems: "start",
      }}
    >
      {children}
    </div>
  );
}

function ErrorTaxonomyTable({ items }: { items: ErrorMapping[] }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "1px",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        background: "var(--color-border-subtle)",
      }}
    >
      {items.map((item) => (
        <div
          key={item.code}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) repeat(3, minmax(0, 0.8fr))",
            gap: "var(--spacing-3)",
            alignItems: "center",
            padding: "var(--spacing-3) var(--spacing-4)",
            background: "var(--color-surface)",
          }}
        >
          <code style={{ fontSize: "var(--text-xs)" }}>{item.code}</code>
          <ValuePill value={item.scenario} tone={item.retryable ? "warning" : "danger"} />
          <ValuePill value={item.variant} tone={item.variant === "info" ? "accent" : item.variant === "attention" ? "warning" : "danger"} />
          <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            {item.retryable ? "retry" : "support"}
          </span>
        </div>
      ))}
    </div>
  );
}

function OfflineBannerToggleDemo() {
  const [offline, setOffline] = useState(false);

  return (
    <div style={{ display: "grid", gap: "var(--spacing-4)" }}>
      <Button variant="secondary" size="md" onClick={() => setOffline((value) => !value)}>
        {offline ? "Restore connection" : "Toggle offline"}
      </Button>
      <div
        style={{
          position: "relative",
          minHeight: 200,
          padding: "56px var(--spacing-4) var(--spacing-4)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          overflow: "hidden",
        }}
      >
        <OfflineBanner visible={offline} />
        <div style={{ display: "grid", gap: "var(--spacing-3)" }}>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Mock miniapp content remains in place while the system banner enters above it.
          </div>
          <div style={{ height: 80, borderRadius: "var(--radius-md)", background: "var(--color-surface-2)" }} />
          <div style={{ height: 80, borderRadius: "var(--radius-md)", background: "var(--color-surface-2)" }} />
        </div>
      </div>
    </div>
  );
}

function RetryEscalationDemo() {
  const [attempts, setAttempts] = useState(0);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    window.setTimeout(() => {
      setRetrying(false);
      setAttempts((value) => value + 1);
    }, 900);
  };

  return (
    <FallbackScreen
      title="Unable to refresh subscription"
      message="The billing service did not respond. Retry or escalate to support if the issue persists."
      onRetry={handleRetry}
      retryable
      retryCount={attempts}
      isRetrying={retrying}
      maxRetries={3}
      contactSupportHref="#support"
    />
  );
}

function VariantEmptyState({ variant }: { variant: EmptyStateVariant }) {
  const definition = EMPTY_STATE_VARIANTS[variant];

  return (
    <EmptyStateBlock
      variant={variant}
      onAction={definition.ctaLabel ? () => undefined : undefined}
      actionLabel={definition.ctaLabel}
    />
  );
}

export const Default: Story = {
  tags: ["chromatic"],
  parameters: {
    chromatic: {
      viewports: [390, 768, 1280],
    },
  },
  render: () =>
    withQueryClient(
      <StoryPage
        eyebrow="Patterns"
        title="Block patterns"
        summary="Block patterns are the recovery and empty-state surfaces for the miniapp. The documentation below establishes how blocking severity, retry escalation, inline empties, and offline system banners should behave so page code stays consistent."
        stats={[
          { label: "Patterns", value: "4" },
          { label: "Modes", value: "3" },
          { label: "Error variants", value: "4" },
        ]}
      >
        <StorySection
          title="Blocking-state contract"
          description="PageStateScreen and FallbackScreen now expose explicit variant and mode contracts. Blocking screens should differ by accent color, iconography, and overlay behavior rather than only swapping the badge copy."
        >
          <BlockingStateGrid>
            {PAGE_STATE_VARIANTS.slice(0, 3).map((example) => (
              <StoryCard key={example.variant} title={example.title} caption={example.caption}>
                <BlockPreviewFrame minHeight={276}>
                  <PageStateScreen
                    variant={example.variant}
                    mode={example.mode}
                    label={example.label}
                    chipText={example.chipText}
                    alertTitle={example.title}
                    alertMessage={example.message}
                    actions={example.actions}
                  />
                </BlockPreviewFrame>
              </StoryCard>
            ))}
          </BlockingStateGrid>
          <UsageExample
            title="Fatal replacement state"
            description="Fatal route failures keep the same family structure as other page states, but escalate to a full-border frame and destructive recovery treatment."
          >
            <PageStateScreen
              variant="fatal"
              mode="replace"
              label="System Error"
              chipText="Fatal"
              alertTitle="Configuration is no longer valid"
              alertMessage="Secure transport failed validation. The session must be restored before traffic can continue."
              actions={<MissionPrimaryButton tone="danger">Restore access</MissionPrimaryButton>}
            />
          </UsageExample>
        </StorySection>

        <StorySection
          title="Recovery and escalation"
          description="FallbackScreen owns the CTA matrix. Retryable failures keep support secondary, non-retryable failures promote support to primary, and repeated failures escalate support automatically."
        >
          <TwoColumn>
            <StoryCard title="Retryable error" caption="Primary retry, secondary support.">
              <BlockPreviewFrame minHeight={248}>
                <FallbackScreen
                  title="Unable to load account"
                  message="We could not retrieve your subscription state. Try again or contact support."
                  onRetry={() => undefined}
                  retryable
                  contactSupportHref="#support"
                />
              </BlockPreviewFrame>
            </StoryCard>
            <StoryCard title="Retry escalation" caption="After three failed attempts support becomes the primary recovery path.">
              <BlockPreviewFrame minHeight={248}>
                <RetryEscalationDemo />
              </BlockPreviewFrame>
            </StoryCard>
          </TwoColumn>
          <UsageExample
            title="Error taxonomy"
            description="These mappings document which backend failure classes should produce retryable, auth, timeout, or fatal states."
          >
            <ErrorTaxonomyTable items={ERROR_TAXONOMY} />
          </UsageExample>
        </StorySection>

        <StorySection
          title="Empty and offline surfaces"
          description="Compact empty states should come from a fixed variant catalog, and the offline banner should render as a real top-fixed system surface rather than prose-only documentation."
        >
          <ThreeColumn>
            <StoryCard title="No devices" caption="Canonical first-run empty state.">
              <VariantEmptyState variant="no_devices" />
            </StoryCard>
            <StoryCard title="No results" caption="Filter/search empty state with clear reset action.">
              <VariantEmptyState variant="no_results" />
            </StoryCard>
            <StoryCard title="Load failed" caption="Section-level empty/failure hybrid.">
              <VariantEmptyState variant="loading_failed" />
            </StoryCard>
          </ThreeColumn>
          <UsageExample
            title="Offline banner"
            description="The banner stays non-dismissible, fixed above content, and should be tested as an actual component surface rather than only described in text."
          >
            <OfflineBannerToggleDemo />
          </UsageExample>
        </StorySection>
      </StoryPage>
    ),
};

export const PageState: Story = {
  tags: ["chromatic"],
  render: () =>
    withQueryClient(
      <BlockStoryFrame>
        <PageStateScreen
          variant="attention"
          mode="overlay"
          label="Permission"
          chipText="Attention"
          alertTitle="VPN permission required"
          alertMessage="Complete device setup to continue."
          actions={<MissionPrimaryButton tone="warning">Continue setup</MissionPrimaryButton>}
        />
      </BlockStoryFrame>
    ),
};

export const Fallback: Story = {
  tags: ["chromatic"],
  render: () =>
    withQueryClient(
      <BlockStoryFrame>
        <FallbackScreen
          title="Unable to load account"
          message="We could not retrieve your subscription state. Try again or contact support."
          onRetry={() => undefined}
          retryable
          contactSupportHref="#support"
        />
      </BlockStoryFrame>
    ),
};

export const EmptyState: Story = {
  render: () =>
    withQueryClient(
      <BlockStoryFrame>
        <VariantEmptyState variant="no_devices" />
      </BlockStoryFrame>
    ),
};

export const OfflineBannerDemo: Story = {
  tags: ["!chromatic"],
  render: () =>
    withQueryClient(
      <BlockStoryFrame paddedForBanner>
        <OfflineBannerToggleDemo />
      </BlockStoryFrame>
    ),
};

export const ErrorTaxonomy: Story = {
  tags: ["!chromatic"],
  render: () =>
    withQueryClient(
      <BlockStoryFrame>
        <ErrorTaxonomyTable items={ERROR_TAXONOMY} />
      </BlockStoryFrame>
    ),
};
