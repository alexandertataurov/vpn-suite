import type { Meta, StoryObj } from "@storybook/react";
import { StoryShowcase } from "@/design-system";
import { DeviceHeroCard } from "./DeviceHeroCard";

const meta: Meta<typeof DeviceHeroCard> = {
  title: "Recipes/Devices/DeviceHeroCard",
  tags: ["autodocs"],
  component: DeviceHeroCard,
  parameters: {
    layout: "padded",
    viewport: {
      defaultViewport: "iphone12",
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const AllSet: Story = {
  args: {
    devicesUsed: 1,
    devicesTotal: 5,
    setupPending: 0,
    trafficUsed: "12 GB",
  },
  render: (args) => (
    <StoryShowcase>
      <DeviceHeroCard {...args} />
    </StoryShowcase>
  ),
};

export const PendingSetup: Story = {
  args: {
    devicesUsed: 2,
    devicesTotal: 5,
    setupPending: 2,
    trafficUsed: "4 GB",
  },
  render: (args) => (
    <StoryShowcase>
      <DeviceHeroCard {...args} />
    </StoryShowcase>
  ),
};
