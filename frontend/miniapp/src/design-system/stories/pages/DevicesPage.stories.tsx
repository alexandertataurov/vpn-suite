import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { expect, userEvent, within } from "storybook/test";
import { DevicesPage } from "@/pages/Devices";
import {
  emptyDevicesScenario,
  failureScenario,
  limitReachedScenario,
  loadingSessionScenario,
  noPlanScenario,
  PageSandbox,
  readyScenario,
} from "@/storybook/page-contracts";

const pageStoryParameters = {
  layout: "fullscreen" as const,
  viewport: { defaultViewport: "iphone14" },
  status: { type: "stable" as const },
};

const meta: Meta = {
  title: "Pages/Contracts/Devices",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component: "Device management route under the production-like shell, including empty, at-limit, no-plan, loading, and error states.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const ActiveDevices: Story = {
  name: "Active devices",
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Devices route with the current device list, summary card, and setup/config sections.",
      },
    },
  },
};

export const Empty: Story = {
  name: "No devices yet",
  render: () => (
    <PageSandbox scenario={emptyDevicesScenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Subscribed user with no active devices yet. The route shows the empty-device list state and setup guidance.",
      },
    },
  },
};

export const LimitReached: Story = {
  render: () => (
    <PageSandbox scenario={limitReachedScenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "All device slots are used. The route shows the upgrade warning and existing devices.",
      },
    },
  },
};

export const NoPlan: Story = {
  name: "Plan required",
  render: () => (
    <PageSandbox scenario={noPlanScenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "No active subscription. The route highlights the plan-required warning before any device actions.",
      },
    },
  },
};

export const Loading: Story = {
  name: "Devices loading",
  render: () => (
    <PageSandbox scenario={loadingSessionScenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Loading state while device, access, and summary data are resolving.",
      },
    },
  },
};

export const Error: Story = {
  name: "Could not load devices",
  render: () => (
    <PageSandbox scenario={failureScenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
    </PageSandbox>
  ),
  parameters: {
    docs: {
      description: {
        story: "Fallback error state when the Devices route cannot load.",
      },
    },
  },
};

export const AddDeviceWizard: Story = {
  name: "Add device wizard",
  render: () => (
    <PageSandbox scenario={readyScenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
    </PageSandbox>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const addDeviceButton = await canvas.findByRole("button", { name: "Add new device" });
    await userEvent.click(addDeviceButton);
    await expect(await page.findByRole("dialog")).toBeInTheDocument();
    await expect(page.getByRole("textbox", { name: "Device name" })).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive: tap Add new device and verify the naming step of the device wizard opens.",
      },
    },
  },
};
