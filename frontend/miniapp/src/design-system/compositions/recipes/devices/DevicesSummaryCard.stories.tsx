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
        component: "Canonical devices summary card used on the Devices page for capacity, setup, and traffic metrics.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const baseMetrics = [
  {
    keyLabel: "Capacity",
    valueLabel: "2 / 5",
    percent: 40,
    tone: "healthy" as const,
    showProgress: true,
  },
  {
    keyLabel: "Setup",
    valueLabel: "2 ready",
    percent: 100,
    tone: "healthy" as const,
    showProgress: true,
  },
  {
    keyLabel: "Traffic",
    valueLabel: "12.4 GB",
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
    title: "Devices",
    description: "2 / 5 active. Manage issued configs, setup confirmation, and device replacement.",
    metrics: baseMetrics,
    action: renderAddDeviceAction(),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Primary devices overview for the live page contract. Validate capacity, setup readiness, traffic, and the single primary add-device action.",
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
          "Healthy and near-capacity states shown together. Review the same summary hierarchy the page model feeds into the Devices screen.",
      },
    },
  },
  render: () => (
    <StorySection title="Variants" description="Active subscription and near-limit device capacity states.">
      <StoryShowcase>
        <StoryStack>
          <DevicesSummaryCard
            title="Devices"
            description="2 / 5 active. Manage issued configs, setup confirmation, and device replacement."
            metrics={baseMetrics}
            action={renderAddDeviceAction()}
          />
          <DevicesSummaryCard
            title="Devices"
            description="4 / 5 active. Import your config in AmneziaVPN, then return here if you want to confirm setup."
            metrics={[
              {
                keyLabel: "Capacity",
                valueLabel: "4 / 5",
                percent: 80,
                tone: "warning",
                showProgress: true,
              },
              {
                keyLabel: "Setup",
                valueLabel: "1 pending",
                percent: 75,
                tone: "warning",
                showProgress: true,
              },
              {
                keyLabel: "Traffic",
                valueLabel: "27.8 GB",
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
