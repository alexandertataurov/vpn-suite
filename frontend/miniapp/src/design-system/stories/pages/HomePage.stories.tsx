import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { HomePage } from "@/pages/Home";
import {
  accessErrorScenario,
  emptyDevicesScenario,
  expiredScenario,
  expiringNoDevicesScenario,
  loadingSessionScenario,
  noPlanScenario,
  PageSandbox,
  readyScenario,
  trialScenario,
} from "@/storybook/page-contracts";
import { PageScaffold, PageLayout, ModernHeader, Skeleton, FooterHelp } from "@/design-system";
import styles from "./HomePage.stories.module.css";

const scenarios = {
  new: noPlanScenario,
  nodevice: emptyDevicesScenario,
  active: readyScenario,
  expiring: trialScenario,
  expired: expiredScenario,
  loading: loadingSessionScenario,
  error: accessErrorScenario,
} as const;

const expiringNoDevicesScenarios = {
  ...scenarios,
  expiring: expiringNoDevicesScenario,
};

function HomeErrorState() {
  return (
    <PageScaffold>
      <PageLayout scrollable={false}>
        <ModernHeader title="Amnezia" />
        <div className={styles.homeErrorStack}>
          <Skeleton variant="card" height={180} />
          <p className={styles.homeErrorLabel}>Couldn&apos;t load · Tap to retry</p>
          <Skeleton variant="card" height={120} />
          <Skeleton variant="card" height={72} />
        </div>
        <FooterHelp
          note="Having trouble?"
          linkLabel="View setup guide"
          onLinkClick={() => {}}
        />
      </PageLayout>
    </PageScaffold>
  );
}

const meta: Meta<{
  state: keyof typeof scenarios;
  expiringNoDevices: boolean;
}> = {
  title: "Pages/Contracts/Home",
  tags: ["autodocs"],
  argTypes: {
    state: {
      control: "select",
      options: ["new", "nodevice", "active", "expiring", "expired", "loading", "error"],
      description: "Page state",
    },
    expiringNoDevices: {
      control: "boolean",
      description: "When expiring: use 0 devices (callout above banner)",
    },
  },
  args: {
    state: "active",
    expiringNoDevices: false,
  },
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "iphone14" },
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Home route. Contract tests with production-faithful scenarios. Use state arg to switch between new, nodevice, active, expiring, expired, loading, error.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

function getScenario(
  state: keyof typeof scenarios,
  expiringNoDevices: boolean
) {
  const map = expiringNoDevices ? expiringNoDevicesScenarios : scenarios;
  return map[state];
}

export const Home: Story = {
  args: { state: "active" },
  render: ({ state, expiringNoDevices }) => {
    if (state === "error") {
      return (
        <PageSandbox scenario={accessErrorScenario} initialEntries={["/"]}>
          <Route path="/" element={<HomeErrorState />} />
        </PageSandbox>
      );
    }
    const scenario = getScenario(state, expiringNoDevices);
    return (
      <PageSandbox scenario={scenario} initialEntries={["/"]}>
        <Route path="/" element={<HomePage />} />
      </PageSandbox>
    );
  },
};

export const New: Story = { args: { state: "new" } };
export const NoDevice: Story = { args: { state: "nodevice" } };
export const Active: Story = { args: { state: "active" } };
export const Expiring: Story = { args: { state: "expiring" } };
export const Expired: Story = { args: { state: "expired" } };
export const Loading: Story = { args: { state: "loading" } };
export const Error: Story = { args: { state: "error" } };
