import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { expect, userEvent, within } from "storybook/test";
import { ConfigCardContent } from "@/design-system/recipes";

const meta: Meta<typeof ConfigCardContent> = {
  title: "Recipes/Devices/ConfigCardContent",
  tags: ["autodocs"],
  component: ConfigCardContent,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Configuration delivery card used after issuing a device, with ready and pending contract states and a primary copy action.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const configText = `[Interface]
PrivateKey = <redacted>
Address = 10.8.0.2/32

[Peer]
PublicKey = <redacted>
AllowedIPs = 0.0.0.0/0
Endpoint = vpn.example.com:51820`;

export const Default: Story = {
  args: {
    configText,
    routeReason: "device_ready",
    peerCreated: true,
    onCopy: async () => true,
    onDownload: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          "Issued config state with copy and download affordances visible and ready to use.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <ConfigCardContent {...args} />
    </StoryShowcase>
  ),
};

export const InteractiveCopyConfig: Story = {
  name: "Interactive · copy config",
  args: {
    configText,
    routeReason: "device_ready",
    peerCreated: true,
    onCopy: async () => true,
    onDownload: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Copy config" }));
    expect(await canvas.findByText("Copied")).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story:
          "Copies the config and verifies the transient success state so the primary action remains testable.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <ConfigCardContent {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection
      title="Variants"
      description="Ready config and not-yet-confirmed issuance states."
    >
      <StoryShowcase>
        <StoryStack>
          <ConfigCardContent
            configText={configText}
            routeReason="device_ready"
            peerCreated
            onCopy={async () => true}
            onDownload={() => {}}
          />
          <ConfigCardContent
            configText={configText}
            routeReason="connection_not_confirmed"
            peerCreated={false}
            onCopy={async () => true}
            onDownload={() => {}}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
