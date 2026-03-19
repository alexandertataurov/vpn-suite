import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { DevicesPage } from "@/pages/Devices";
import {
  type MockScenario,
  emptyDevicesScenario,
  failureScenario,
  limitReachedScenario,
  loadingSessionScenario,
  noPlanScenario,
  PageSandbox,
  pageStoryParameters,
  readyScenario,
} from "@/storybook/page-contracts";

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

function renderDevicesPage(scenario: MockScenario) {
  return (
    <PageSandbox scenario={scenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
    </PageSandbox>
  );
}

function createDevicesStory(name: string, scenario: MockScenario, description: string): Story {
  return {
    name,
    render: () => renderDevicesPage(scenario),
    parameters: {
      docs: {
        description: {
          story: description,
        },
      },
    },
  };
}

export const ActiveDevices = createDevicesStory(
  "Active devices",
  readyScenario,
  "Devices route with the current device list, summary card, and setup/config sections.",
);

export const Empty = createDevicesStory(
  "No devices yet",
  emptyDevicesScenario,
  "Subscribed user with no active devices yet. The route shows the empty-device list state and setup guidance.",
);

export const LimitReached = createDevicesStory(
  "Device limit reached",
  limitReachedScenario,
  "All device slots are used. The route shows the upgrade warning and existing devices.",
);

export const NoPlan = createDevicesStory(
  "Plan required",
  noPlanScenario,
  "No active subscription. The route highlights the plan-required warning before any device actions.",
);

export const Loading = createDevicesStory(
  "Devices loading",
  loadingSessionScenario,
  "Loading state while device, access, and summary data are resolving.",
);

export const Error = createDevicesStory(
  "Could not load devices",
  failureScenario,
  "Fallback error state when the Devices route cannot load.",
);
