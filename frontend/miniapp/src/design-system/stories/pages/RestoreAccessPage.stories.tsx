import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { RestoreAccessPage } from "@/pages/RestoreAccess";
import {
  loadingSessionScenario,
  loggedOutScenario,
  PageSandbox,
  readyScenario,
  restoreScenario,
} from "@/storybook/page-contracts";

const pageStoryParameters = {
  layout: "fullscreen" as const,
  viewport: { defaultViewport: "iphone14" },
  status: { type: "stable" as const },
};

const meta: Meta = {
  title: "Pages/Contracts/RestoreAccess",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component: "Restore Access route used when a subscription has expired or entered grace. Covers restorable, non-restorable, loading, and session-missing states.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Restorable: Story = {
  name: "Restore access",
  render: () => (
    <PageSandbox scenario={restoreScenario} initialEntries={["/restore-access"]}>
      <Route path="/restore-access" element={<RestoreAccessPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Expired or grace-period subscription with the restore action available in the sticky bottom bar.",
      },
    },
  },
};

export const NotRestorable: Story = {
  name: "No expired subscription",
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/restore-access"]}>
      <Route path="/restore-access" element={<RestoreAccessPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Signed-in user without an expired/grace subscription. Inline support and devices actions are shown instead.",
      },
    },
  },
};

export const LoadingSession: Story = {
  name: "Session loading",
  render: () => (
    <PageSandbox scenario={loadingSessionScenario} initialEntries={["/restore-access"]}>
      <Route path="/restore-access" element={<RestoreAccessPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Route shell visible while the session is still loading before restore eligibility is known.",
      },
    },
  },
};

export const SessionMissing: Story = {
  name: "Session missing",
  render: () => (
    <PageSandbox scenario={loggedOutScenario} initialEntries={["/restore-access"]}>
      <Route path="/restore-access" element={<RestoreAccessPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "No session token. The route resolves to the same session-missing screen as the app.",
      },
    },
  },
};
