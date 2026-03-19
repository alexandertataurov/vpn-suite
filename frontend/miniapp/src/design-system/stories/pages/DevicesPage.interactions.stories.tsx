import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "react-router-dom";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DevicesPage } from "@/pages/Devices";
import {
  PageSandbox,
  pageStoryParameters,
  readyScenario,
} from "@/storybook/page-contracts";

const meta: Meta = {
  title: "Pages/Contracts/Devices Interactions",
  tags: ["autodocs"],
  parameters: {
    ...pageStoryParameters,
    docs: {
      description: {
        component:
          "Interactive and responsive coverage for the Devices route, kept separate from the route-state matrix.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

function renderDevicesPage() {
  return (
    <PageSandbox scenario={readyScenario} initialEntries={["/devices"]}>
      <Route path="/devices" element={<DevicesPage />} />
    </PageSandbox>
  );
}

export const MobileNarrow: Story = {
  render: () => renderDevicesPage(),
  parameters: {
    viewport: { defaultViewport: "iphoneSE" },
    docs: {
      description: {
        story: "320px viewport. The device summary and actions remain usable in the narrow layout.",
      },
    },
  },
};

export const AddDeviceWizard: Story = {
  name: "Add device wizard",
  render: () => renderDevicesPage(),
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
        story: "Interactive: tap Add new device and verify the naming step of the device wizard opens.",
      },
    },
  },
};
