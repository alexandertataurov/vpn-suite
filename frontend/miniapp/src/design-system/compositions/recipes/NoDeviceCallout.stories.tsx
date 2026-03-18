import type { Meta, StoryObj } from "@storybook/react";
import { NoDeviceCallout } from "./NoDeviceCallout";

const meta = {
  title: "Patterns/NoDeviceCallout",
  tags: ["autodocs"],
  component: NoDeviceCallout,
  parameters: {
    docs: { description: { component: "No-device callout per amnezia spec §4.9. Inline prompt when user has paid but no device added." } },
  },
} satisfies Meta<typeof NoDeviceCallout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Add your first device",
    subtitle: "Connect a device to start using your VPN.",
    ctaLabel: "Add device",
    onCtaClick: () => {},
  },
};
