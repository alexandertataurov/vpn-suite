import type { Meta, StoryObj } from "@storybook/react";
import { ListCard, StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { DeviceRow } from "./DeviceRow";

const meta: Meta<typeof DeviceRow> = {
  title: "Recipes/Devices/DeviceRow",
  tags: ["autodocs"],
  component: DeviceRow,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Canonical device list row used on the Devices page, covering connected, pending, and revoked states without page-local copies.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs = {
  formatIssuedAt: (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  onConfirm: () => {},
  onReplace: () => {},
  onRevoke: () => {},
  onRename: () => {},
  isConfirmingId: null,
  isReplacingId: null,
};

export const Default: Story = {
  args: {
    ...baseArgs,
    device: {
      id: "peer_iphone_01",
      device_name: "iPhone 15 Pro",
      status: "connected",
      issued_at: "2026-03-01T10:00:00Z",
      last_seen_handshake_at: "2026-03-19T10:30:00Z",
    },
  },
  render: (args) => (
    <StoryShowcase>
      <ListCard>
        <DeviceRow {...args} />
      </ListCard>
    </StoryShowcase>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Connected device row with handshake recency and the normal list-row action layout.",
      },
    },
  },
};

export const Variants: Story = {
  render: () => (
    <StorySection
      title="Variants"
      description="Connected, configuration pending, and revoked device states."
    >
      <StoryShowcase>
        <StoryStack>
          <ListCard>
            <DeviceRow
              {...baseArgs}
              device={{
                id: "peer_iphone_01",
                device_name: "iPhone 15 Pro",
                status: "connected",
                issued_at: "2026-03-01T10:00:00Z",
                last_seen_handshake_at: "2026-03-19T10:30:00Z",
              }}
            />
            <DeviceRow
              {...baseArgs}
              isConfirmingId="peer_macbook_01"
              device={{
                id: "peer_macbook_01",
                device_name: "MacBook Air",
                status: "config_pending",
                issued_at: "2026-03-15T09:20:00Z",
              }}
            />
            <DeviceRow
              {...baseArgs}
              device={{
                id: "peer_win_01",
                device_name: "Windows Laptop",
                status: "revoked",
                issued_at: "2026-02-12T08:00:00Z",
                last_seen_handshake_at: "2026-02-27T12:10:00Z",
              }}
            />
          </ListCard>
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
