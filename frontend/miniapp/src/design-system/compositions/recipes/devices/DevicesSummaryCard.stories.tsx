import type { Meta, StoryObj } from "@storybook/react";
import { Button, StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { IconPlus } from "@/design-system/icons";
import { DevicesSummaryCard } from "./DevicesSummaryCard";

const meta: Meta<typeof DevicesSummaryCard> = {
  title: "Recipes/Devices/DevicesSummaryCard",
  tags: ["autodocs"],
  component: DevicesSummaryCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Devices overview hero used on the Devices page, with plan, capacity, and recent-activity metrics.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const baseMetrics = [
  {
    keyLabel: "Devices",
    valueLabel: "2 / 5",
    percent: 40,
    tone: "healthy" as const,
    showProgress: true,
  },
  {
    keyLabel: "Plan",
    valueLabel: "Pro annual",
    percent: 0,
    tone: "neutral" as const,
    showProgress: false,
  },
  {
    keyLabel: "Last added",
    valueLabel: "Today",
    percent: 0,
    tone: "neutral" as const,
    showProgress: false,
  },
];

function renderAddDeviceAction() {
  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      startIcon={<IconPlus size={16} strokeWidth={2} aria-hidden />}
    >
      Add new device
    </Button>
  );
}

export const Default: Story = {
  args: {
    title: "Protected devices",
    description: "Manage device access and configuration delivery.",
    metrics: baseMetrics,
    action: renderAddDeviceAction(),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Primary devices overview for the Devices page. Check that capacity, plan, and recent activity all read as a single control surface.",
      },
    },
  },
  render: (args) => (
    <StoryShowcase>
      <DevicesSummaryCard {...args} />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Healthy and near-capacity states shown together. Review the progression from normal usage to the point where an upgrade prompt becomes necessary.",
      },
    },
  },
  render: () => (
    <StorySection title="Variants" description="Active subscription and near-limit device capacity states.">
      <StoryShowcase>
        <StoryStack>
          <DevicesSummaryCard
            title="Protected devices"
            description="Manage device access and configuration delivery."
            metrics={baseMetrics}
            action={renderAddDeviceAction()}
          />
          <DevicesSummaryCard
            title="Device limit approaching"
            description="One slot left on your current plan."
            metrics={[
              {
                keyLabel: "Devices",
                valueLabel: "4 / 5",
                percent: 80,
                tone: "warning",
                showProgress: true,
              },
              {
                keyLabel: "Plan",
                valueLabel: "Pro annual",
                percent: 0,
                tone: "neutral",
                showProgress: false,
              },
              {
                keyLabel: "Last handshake",
                valueLabel: "2m ago",
                percent: 0,
                tone: "neutral",
                showProgress: false,
              },
            ]}
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
