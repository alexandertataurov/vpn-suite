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
  loggedOutScenario,
  noPlanScenario,
  PageSandbox,
  pageStoryParameters,
  readyScenario,
} from "@/storybook/page-contracts";

const DOC_BODY = [
  "**Devices** (`/devices`): hero metrics, device list with overflow actions, add-device wizard, setup card, and config delivery.",
  "**Scenarios** (from `page-contracts`): ready · empty devices · limit reached · no plan · loading (`me` pending) · load error (`me` 500) · session missing (no token).",
  "**Interactions**: primary CTA opens the wizard; first row **Device actions → Rename** opens the rename modal (stable English `devices.*` strings).",
  "Viewport stories use `iphoneSE` / `adminDesktop` to catch layout regressions.",
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

export const SessionMissing = scenarioStory(
  "Session missing",
  loggedOutScenario,
  "`SessionMissing` when there is no webapp token — matches `useDevicesPageModel` empty state.",
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
        story:
          "Clicks the full-width **Add new device** button (`devices.add_new_device`), then asserts a `dialog` and the name `input` (`devices.wizard_name_label` → aria-label **Device name**).",
      },
    },
  },
};

export const InteractiveOpenRenameFromRowMenu: Story = {
  name: "Interactive · rename from row menu",
  render: () => renderDevices(readyScenario),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previewDocument = canvasElement.ownerDocument;
    const actionTriggers = await canvas.findAllByRole("button", { name: "Device actions" });
    const firstRowMenu = actionTriggers[0];
    if (!firstRowMenu) {
      throw new Error("Expected at least one device row with an overflow trigger.");
    }
    await userEvent.click(firstRowMenu);
    const renameItem = await canvas.findByRole("menuitem", { name: "Rename" });
    await userEvent.click(renameItem);
    await waitFor(() => {
      const dialog = previewDocument.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(
        previewDocument.querySelector('input[aria-label="Device name"]'),
      ).not.toBeNull();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "Opens the first row’s overflow menu (`devices.menu_trigger_aria` → **Device actions**), selects **Rename** (`devices.menu_rename_device`), and asserts the rename modal dialog plus the name field (`devices.rename_modal_placeholder` → aria-label **Device name**).",
      },
    },
  },
};
