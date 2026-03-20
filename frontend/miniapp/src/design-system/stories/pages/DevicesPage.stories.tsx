import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { expect, userEvent, waitFor, within } from "storybook/test";
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

const DOC_BODY = [
  "**Devices** (`/devices`): device list, add-device wizard, limits, and setup/config cards.",
  "State matrix + **interaction** + **viewport** stories live in this file (legacy split `Devices Interactions` removed).",
  "Wizard `play` targets stable accessible names from production copy.",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "iphoneSE" as const } };
const VIEW_WIDE = { viewport: { defaultViewport: "adminDesktop" as const } };

const meta = {
  title: "Pages/Contracts/Devices",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component: DOC_BODY,
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function renderDevices(scenario: MockScenario) {
  return (
    <PageSandbox scenario={scenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
    </PageSandbox>
  );
}

function scenarioStory(
  name: string,
  scenario: MockScenario,
  storyDescription: string,
  extra?: Story["parameters"],
): Story {
  return {
    name,
    render: () => renderDevices(scenario),
    parameters: {
      ...extra,
      docs: {
        description: {
          story: storyDescription,
        },
      },
    },
  };
}

export const ActiveDevices = scenarioStory(
  "Active devices",
  readyScenario,
  "Populated list, summary, and per-device actions.",
);

export const EmptyDeviceList = scenarioStory(
  "No devices yet",
  emptyDevicesScenario,
  "Subscribed user awaiting first issuance — empty list + setup guidance.",
);

export const DeviceLimitReached = scenarioStory(
  "Device limit reached",
  limitReachedScenario,
  "Slots full — upgrade nudge with existing rows still visible.",
);

export const PlanRequired = scenarioStory(
  "Plan required",
  noPlanScenario,
  "No subscription — gating copy before add-device actions.",
);

export const Loading = scenarioStory(
  "Devices loading",
  loadingSessionScenario,
  "Skeleton state for list + summary while queries resolve.",
);

export const LoadError = scenarioStory(
  "Could not load devices",
  failureScenario,
  "Error screen and retry wiring.",
);

export const ViewportNarrow = scenarioStory(
  "Viewport · narrow",
  readyScenario,
  "320px — list density and floating actions.",
  VIEW_NARROW,
);

export const ViewportWide = scenarioStory(
  "Viewport · wide",
  readyScenario,
  "Wide layout — cards and device table spacing.",
  VIEW_WIDE,
);

export const InteractiveAddDeviceWizard: Story = {
  name: "Interactive · add device wizard",
  render: () => renderDevices(readyScenario),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previewDocument = canvasElement.ownerDocument;
    const addDeviceButton = await canvas.findByRole("button", { name: "Add new device" });
    await userEvent.click(addDeviceButton);
    await waitFor(() => {
      expect(previewDocument.querySelector('[role="dialog"]')).not.toBeNull();
      expect(previewDocument.querySelector('input[aria-label="Device name"]')).not.toBeNull();
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Opens wizard dialog and lands on the device name field (dialog + labelled input).",
      },
    },
  },
};
