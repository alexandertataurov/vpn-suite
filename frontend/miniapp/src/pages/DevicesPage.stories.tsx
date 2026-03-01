import type { Meta, StoryObj } from "@storybook/react";
import { DevicesPage } from "./Devices";
import { MockWebappApi } from "../storybook/webappMocks";
import { MiniappFrame } from "../storybook/wrappers";
import { webappMeActive, webappMeNoSubscription, webappMeNoDevices, webappMeRevokedOnly } from "../storybook/fixtures";
import { Body } from "../ui";

const meta: Meta<typeof DevicesPage> = {
  title: "Pages/Miniapp/Devices",
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

export const Overview: Story = {
  render: () => renderPage({ mode: "success", me: webappMeActive }),
};

export const Variants: Story = {
  render: () => renderPage({ mode: "success", me: webappMeNoSubscription }),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <Body>Reference layout only; size variants are not exposed.</Body>
      {renderPage({ mode: "success", me: webappMeActive })}
    </div>
  ),
};

export const States: Story = {
  render: () => renderPage({ mode: "error" }),
};

export const WithLongText: Story = {
  render: () => renderPage({
    mode: "success",
    me: {
      ...webappMeActive,
      devices: webappMeActive.devices.map((device) => ({
        ...device,
        device_name: `${device.device_name} — personal laptop with a very long device name`,
      })),
    },
  }),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => renderPage({ mode: "success", me: webappMeNoDevices }),
};

export const Accessibility: Story = {
  render: () => renderPage({ mode: "success", me: webappMeRevokedOnly }),
};

export const EdgeCases = WithLongText;
