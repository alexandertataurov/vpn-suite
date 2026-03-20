import type { Meta, StoryObj } from "@storybook/react";
import { StoryShowcase } from "@/design-system";
import { DeviceRowActions } from "./DeviceRowActions";
import "./DeviceRecipes.css";

const meta: Meta<typeof DeviceRowActions> = {
  title: "Recipes/Devices/DeviceRowActions",
  tags: ["autodocs"],
  component: DeviceRowActions,
  parameters: { layout: "padded" },
  argTypes: {
    deviceStatus: {
      control: "select",
      options: ["connected", "idle", "config_pending", "revoked"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const noop = () => {};

export const Default: Story = {
  args: {
    deviceId: "dev_1",
    subjectLabel: "Work laptop",
    deviceStatus: "idle",
    onConfirm: noop,
    onReplace: noop,
    onRevoke: noop,
    onRename: noop,
    isConfirmingId: null,
    isReplacingId: null,
  },
  render: (args) => (
    <StoryShowcase>
      <div className="story-device-row-actions">
        <DeviceRowActions {...args} />
      </div>
    </StoryShowcase>
  ),
};

export const Connected: Story = {
  ...Default,
  args: {
    ...Default.args,
    deviceStatus: "connected",
  },
};
