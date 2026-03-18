import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { within, userEvent, expect } from "storybook/test";
import { SettingsPage } from "@/pages/Settings";
import {
  PageSandbox,
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
    viewport: { defaultViewport: "iphone14" },
    layout: "fullscreen",
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

export const Default: Story = {
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

export const ProfileModalOpen: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings?modal=profile"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Profile edit modal opened via URL param.",
      },
    },
  },
};

export const MobileNarrow: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    viewport: { defaultViewport: "iphoneSE" },
    docs: {
      description: {
        story: "320px viewport. Smallest supported mobile.",
      },
    },
  },
};

export const Tablet: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  parameters: {
    viewport: { defaultViewport: "adminDesktop" },
    docs: {
      description: {
        story: "Desktop/tablet viewport. Stack layout adapts.",
      },
    },
  },
};

export const OpenProfileModal: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editProfile = await canvas.findByRole("button", { name: /edit profile/i });
    await userEvent.click(editProfile);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive: click Edit profile to open modal.",
      },
    },
  },
};

export const OpenLanguageMenu: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const languageRow = await canvas.findByRole("button", { name: /language/i });
    await userEvent.click(languageRow);
    await expect(canvas.getByRole("menu")).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive: open language selector menu.",
      },
    },
  },
};

export const OpenCancelFlow: Story = {
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/settings"]}>
      <Route path="/settings" element={<SettingsPage />} />
    </PageSandbox>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cancelPlan = await canvas.findByRole("button", { name: /cancel plan/i });
    await userEvent.click(cancelPlan);
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive: open subscription cancellation flow.",
      },
    },
  },
};
