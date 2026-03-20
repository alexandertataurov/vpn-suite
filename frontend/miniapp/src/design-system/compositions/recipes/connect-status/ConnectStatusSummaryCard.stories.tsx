import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { ConnectStatusSummaryCard } from "./ConnectStatusSummaryCard";

const meta: Meta<typeof ConnectStatusSummaryCard> = {
  title: "Recipes/ConnectStatus/ConnectStatusSummaryCard",
  tags: ["autodocs"],
  component: ConnectStatusSummaryCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Status summary card used on the connection-confirmation route.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Connection check required",
    subtitle: "Finish setup in AmneziaVPN, then come back to confirm.",
    edge: "e-a",
    latestDeviceName: "iPhone 15 Pro",
  },
  render: (args) => (
    <StoryShowcase>
      <ConnectStatusSummaryCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Warning, success, and error summary states.">
      <StoryShowcase>
        <StoryStack>
          <ConnectStatusSummaryCard
            title="Connection check required"
            subtitle="Finish setup in AmneziaVPN, then come back to confirm."
            edge="e-a"
            latestDeviceName="iPhone 15 Pro"
          />
          <ConnectStatusSummaryCard
            title="VPN is connected"
            subtitle="Your configuration is active and ready to use."
            edge="e-g"
            latestDeviceName="MacBook Air"
          />
          <ConnectStatusSummaryCard
            title="No handshake detected"
            subtitle="Open the VPN app and connect once before retrying."
            edge="e-r"
            latestDeviceName="Windows Laptop"
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
