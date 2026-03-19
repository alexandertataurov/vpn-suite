import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { SettingsPage } from "@/pages/Settings";
import {
  PageSandbox,
  pageStoryParameters,
  readyScenario,
  trialScenario,
  expiredScenario,
  noPlanScenario,
  emptyDevicesScenario,
  limitReachedScenario,
  loadingSessionScenario,
  loggedOutScenario,
  failureScenario,
  longNameScenario,
  expiringSoonScenario,
} from "@/storybook/page-contracts";

const meta: Meta = {
  title: "Pages/Contracts/Settings",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component:
          "Account and settings page. Full page-level stories with providers, router, and mocked API. Use for design review, QA, accessibility, and interaction testing.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const ActiveSubscription: Story = {
  name: "Active subscription",
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Happy path. User with active subscription, devices, and full profile.",
      },
    },
  },
};

export const Loading: Story = {
  name: "Settings loading",
  render: () => (
    <PageSandbox scenario={loadingSessionScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Skeleton state while session and access data load.",
      },
    },
  },
};

export const Error: Story = {
  name: "Could not load settings",
  render: () => (
    <PageSandbox scenario={failureScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "API error. Fallback screen with retry.",
      },
    },
  },
};

export const SessionMissing: Story = {
  name: "Session missing",
  render: () => (
    <PageSandbox scenario={loggedOutScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "No token. Session missing / reopen from bot.",
      },
    },
  },
};

export const NoPlan: Story = {
  name: "No active plan",
  render: () => (
    <PageSandbox scenario={noPlanScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "User without subscription. CTA to choose plan.",
      },
    },
  },
};

export const Expired: Story = {
  name: "Subscription expired",
  render: () => (
    <PageSandbox scenario={expiredScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Subscription expired. Grace period or restore flow.",
      },
    },
  },
};

export const ExpiringSoon: Story = {
  render: () => (
    <PageSandbox scenario={expiringSoonScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Subscription expiring within a week. Renewal banner.",
      },
    },
  },
};

export const TrialEnding: Story = {
  render: () => (
    <PageSandbox scenario={trialScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Trial ending soon. Upgrade prompts.",
      },
    },
  },
};

export const EmptyDevices: Story = {
  render: () => (
    <PageSandbox scenario={emptyDevicesScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Active plan but no devices. Setup guide CTA.",
      },
    },
  },
};

export const DeviceLimitReached: Story = {
  render: () => (
    <PageSandbox scenario={limitReachedScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "All device slots used. Upgrade or revoke to add more.",
      },
    },
  },
};

export const LongContent: Story = {
  render: () => (
    <PageSandbox scenario={longNameScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Edge case: very long display name and email. Layout stress test.",
      },
    },
  },
};
