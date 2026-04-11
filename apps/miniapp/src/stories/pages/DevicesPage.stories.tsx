import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DevicesPage } from "@/features/devices/DevicesPage";
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
  "**Devices** (`/devices`) covers the device hero metrics, list actions, add-device wizard, setup card, config delivery flow, and revoke confirmation.",
  "**Scenarios** (from `page-contracts`) cover ready, empty devices, limit reached, no plan, loading (`me` pending), load error (`me` 500), and session missing.",
  "**Interactions**: the primary CTA opens the wizard; the first row `Device actions → Rename` opens the rename modal; `Device actions → Remove device` opens the revoke confirm modal; config delivery appears after issuing a device and exposes copy/download actions.",
  "Viewport stories use `iphoneSE` and `adminDesktop` to catch layout regressions.",
].join("\n\n");

const VIEW_NARROW = { viewport: { defaultViewport: "mobile390" as const } };
const VIEW_WIDE = { viewport: { defaultViewport: "desktop" as const } };

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

function devicesRoutes() {
  return (
    <>
      <Route path="/devices" element={<DevicesPage />} />
      <Route path="/devices/issue" element={<DevicesPage />} />
    </>
  );
}

function renderDevices(scenario: MockScenario) {
  return (
    <PageSandbox scenario={scenario} initialEntries={["/devices"]}>
      {devicesRoutes()}
    </PageSandbox>
  );
}

function renderDevicesIssueDeepLink(scenario: MockScenario) {
  return (
    <PageSandbox scenario={scenario} initialEntries={["/devices/issue"]}>
      {devicesRoutes()}
    </PageSandbox>
  );
}

const issueConfigDeliveryScenario: MockScenario = {
  ...readyScenario,
  responses: {
    ...readyScenario.responses,
    me: {
      ...((readyScenario.responses?.me ?? {}) as Record<string, unknown>),
      config_awg:
        "[Interface]\nPrivateKey = storybook-private-key\nAddress = 10.0.0.2/32\n\n[Peer]\nPublicKey = storybook-peer\nEndpoint = vpn.example.com:51820\nAllowedIPs = 0.0.0.0/0",
      config_wg: "[Interface]\nPrivateKey = storybook-private-key\nAddress = 10.0.0.2/32",
      peer_created: true,
      device_id: "dev-storybook-config",
    },
  },
};

function renderConfigDeliveryDevices() {
  return renderDevices(issueConfigDeliveryScenario);
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

export const DeepLinkIssuePath: Story = {
  name: "Deep link — /devices/issue",
  render: () => renderDevicesIssueDeepLink(readyScenario),
  parameters: {
    docs: {
      description: {
        story:
          "Matches `AppRoutes`: `/devices` and `/devices/issue` both render `DevicesPage`. On `/devices/issue`, the page auto-opens the add-device wizard when `canAddDevice` is true (same as production `useEffect` on `location.pathname`).",
      },
    },
  },
};

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

export const InteractiveConfigDelivery: Story = {
  name: "Interactive · config delivery",
  render: () => renderConfigDeliveryDevices(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previewDocument = canvasElement.ownerDocument;

    const addDeviceButton = await canvas.findByRole("button", { name: "Add new device" });
    await userEvent.click(addDeviceButton);

    const deviceName = await canvas.findByLabelText("Device name");
    await userEvent.type(deviceName, "Work Laptop");

    await userEvent.click(canvas.getByRole("button", { name: "Continue" }));
    await userEvent.click(await canvas.findByRole("button", { name: "Create device" }));

    await waitFor(() => {
      expect(canvas.getByRole("button", { name: "Copy config" })).toBeInTheDocument();
      expect(canvas.getByRole("button", { name: "Download" })).toBeInTheDocument();
    });

    const rawConfigSummary = await canvas.findByText("View raw config");
    await userEvent.click(rawConfigSummary);
    await waitFor(() => {
      expect(previewDocument.querySelector("pre.config-pre")).toHaveTextContent("storybook-private-key");
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "Completes the add-device wizard against a config-delivery fixture, then verifies the issued config card exposes copy/download actions and raw config content.",
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

export const InteractiveOpenRevokeFromRowMenu: Story = {
  name: "Interactive · revoke from row menu",
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
    const revokeItem = await canvas.findByRole("menuitem", { name: "Remove device" });
    await userEvent.click(revokeItem);

    const dialog = await canvas.findByRole("dialog", { name: "Revoke device?" });
    const dialogScope = within(dialog);
    await userEvent.click(await dialogScope.findByRole("button", { name: "Revoke device" }));

    await waitFor(() => {
      expect(previewDocument.querySelector('[role="dialog"]')).toBeNull();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          "Opens the first row overflow menu, selects **Remove device**, and confirms the danger dialog closes after the revoke action.",
      },
    },
  },
};
