import type { Meta, StoryObj } from "@storybook/react";
import { EmptyStateBlock, OfflineBanner } from "@/design-system/compositions/patterns";
import { FallbackScreen } from "./FallbackScreen";
import { PageStateScreen } from "./PageStateScreen";
import { Button } from "@/design-system/components";
import { SessionMissing } from "@/components";
import { ViewportShellProviders } from "@/storybook";
import { StoryCard, StoryPage, StorySection, TwoColumn } from "@/design-system/utils/story-helpers";

const meta = {
  title: "States/System Contracts",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Cross-cutting state contracts for the miniapp. These stories anchor loading, empty, offline, error, auth, and config/device states without tying the contract to one route only.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  render: () => (
    <StoryCard title="Loading" caption="Use inline or page-level loading states before content is ready.">
      <PageStateScreen
        variant="info"
        mode="inline"
        label="Account"
        chipText="Loading"
        alertTitle="Loading account state"
        alertMessage="Fetching subscription, device, and routing data from the miniapp session."
      />
    </StoryCard>
  ),
};

export const Empty: Story = {
  render: () => (
    <EmptyStateBlock
      variant="no_devices"
      title="No devices connected yet"
      message="Issue your first device profile to start routing traffic securely."
      actionLabel="Create device config"
      onAction={() => undefined}
    />
  ),
};

export const Error: Story = {
  render: () => (
    <FallbackScreen
      scenario="retryable"
      title="We could not refresh your account"
      message="Try again in a moment or open support if the issue persists."
      retryLabel="Retry"
      onRetry={() => undefined}
    />
  ),
};

export const Success: Story = {
  render: () => (
    <PageStateScreen
      variant="info"
      mode="inline"
      label="Configuration"
      chipText="Confirmed"
      alertTitle="Configuration confirmed"
      alertMessage="This device has completed handshake verification and can now use the secure route."
    />
  ),
};

export const Offline: Story = {
  render: () => <OfflineBanner visible />,
};

export const SessionMissingState: Story = {
  name: "Session Missing",
  render: () => (
    <ViewportShellProviders>
      <SessionMissing message="This Storybook session is not authenticated. Return to Telegram and reopen the miniapp." />
    </ViewportShellProviders>
  ),
};

export const ExpiredPlan: Story = {
  render: () => (
    <PageStateScreen
      variant="blocked"
      mode="replace"
      label="Subscription"
      chipText="Expired"
      alertTitle="Your plan has expired"
      alertMessage="Restore access to continue using the VPN on existing devices."
      actions={<Button>Restore access</Button>}
    />
  ),
};

export const NoDevices: Story = {
  render: () => (
    <EmptyStateBlock
      variant="no_devices"
      title="No device profile issued"
      message="Create a config file before trying to confirm connection status."
      actionLabel="Issue config"
      onAction={() => undefined}
    />
  ),
};

export const PendingActivation: Story = {
  render: () => (
    <PageStateScreen
      variant="attention"
      mode="overlay"
      label="Setup"
      chipText="Pending"
      alertTitle="Waiting for app action"
      alertMessage="Finish the VPN install step on this device, then return here to confirm traffic routing."
      actions={<Button tone="warning">Continue setup</Button>}
    />
  ),
};

export const ConfigReady: Story = {
  render: () => (
    <StoryPage
      eyebrow="States"
      title="Config ready"
      summary="A ready config should still tell the user what happens next instead of behaving like a silent success."
    >
      <StorySection title="Ready to install" description="Use a concise system message plus one action.">
        <TwoColumn>
          <StoryCard title="Ready" caption="Config exists and can be downloaded or installed.">
            <PageStateScreen
              variant="info"
              mode="inline"
              label="Configuration"
              chipText="Ready"
              alertTitle="Configuration ready"
              alertMessage="Download the latest profile on the target device, then return to confirm the secure connection."
              actions={<Button>Download config</Button>}
            />
          </StoryCard>
        </TwoColumn>
      </StorySection>
    </StoryPage>
  ),
};

export const ConfigMissing: Story = {
  render: () => (
    <FallbackScreen
      scenario="non_retryable"
      title="Configuration missing"
      message="This device no longer has an active profile. Reissue the config before trying to reconnect."
      supportLabel="Reissue config"
    />
  ),
};
