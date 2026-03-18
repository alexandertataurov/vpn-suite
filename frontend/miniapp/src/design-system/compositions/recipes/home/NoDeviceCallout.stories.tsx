import type { Meta, StoryObj } from "@storybook/react";
import { NoDeviceCallout } from "./NoDeviceCallout";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof NoDeviceCallout> = {
  title: "Recipes/Home/NoDeviceCallout",
  tags: ["autodocs"],
  component: NoDeviceCallout,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "No-device callout per amnezia spec §4.9. Inline prompt when user has paid but no device added. Uses design tokens.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Add your first device",
    subtitle: "Connect a device to start using your VPN.",
    ctaLabel: "Add device",
    onCtaClick: () => {},
  },
  render: (args) => (
    <StorySection title="Default" description="Inline prompt when user has paid but no device.">
      <StoryShowcase>
        <NoDeviceCallout {...args} />
      </StoryShowcase>
    </StorySection>
  ),
};
