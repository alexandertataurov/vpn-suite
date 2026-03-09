import type { Meta, StoryObj } from "@storybook/react";
import { DevicesPage } from "./Devices";
import {
  MockWebappApi,
  MiniappFrame,
  webappMeActive,
  webappMeNoSubscription,
  webappMeNoDevices,
  webappMeRevokedOnly,
} from "@/storybook";
import { Body } from "@/design-system";

const meta: Meta<typeof DevicesPage> = {
  title: "Miniapp/Pages/Devices",
  component: DevicesPage,
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: "Miniapp Devices reference layout." } },
  },
};

export default meta;

type Story = StoryObj<typeof DevicesPage>;

const renderPage = (options: Parameters<typeof MockWebappApi>[0]["options"]) => (
  <MockWebappApi options={options}>
    <MiniappFrame>
      <DevicesPage />
    </MiniappFrame>
  </MockWebappApi>
);

export const DevicesPageOverview: Story = {
  render: () => renderPage({ mode: "success", me: webappMeActive }),
};

export const DevicesPageVariants: Story = {
  render: () => renderPage({ mode: "success", me: webappMeNoSubscription }),
};

export const DevicesPageSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <Body>Reference layout only; size variants are not exposed.</Body>
      {renderPage({ mode: "success", me: webappMeActive })}
    </div>
  ),
};

export const DevicesPageStates: Story = {
  render: () => renderPage({ mode: "error" }),
};

export const DevicesPageWithLongText: Story = {
  render: () => renderPage({
    mode: "success",
    me: {
      ...webappMeActive,
      devices: webappMeActive.devices.map((device) => ({ // key=
        ...device,
        device_name: `${device.device_name} — personal laptop with a very long device name`,
      })),
    },
  }),
};

export const DevicesPageDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => renderPage({ mode: "success", me: webappMeNoDevices }),
};

export const DevicesPageAccessibility: Story = {
  render: () => renderPage({ mode: "success", me: webappMeRevokedOnly }),
};

export const DevicesPageEdgeCases = DevicesPageWithLongText;
