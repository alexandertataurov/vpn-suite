import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase } from "@/design-system";
import { DeviceStatusChip } from "./DeviceStatusChip";
import "./DeviceRecipes.css";

const meta: Meta<typeof DeviceStatusChip> = {
  title: "Recipes/Devices/DeviceStatusChip",
  tags: ["autodocs"],
  component: DeviceStatusChip,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <StorySection title="Chip states">
      <StoryShowcase>
        <DeviceStatusChip status="imported" />
        <DeviceStatusChip status="pending" />
        <DeviceStatusChip status="inactive" />
      </StoryShowcase>
    </StorySection>
  ),
};
