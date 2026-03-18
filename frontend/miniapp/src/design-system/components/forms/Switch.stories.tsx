import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Switch } from "./Switch";
import { Inline, Stack } from "@/design-system/core/primitives";

const meta = {
  title: "Components/Switch",
  component: Switch,
  parameters: { layout: "padded" },
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

function DefaultSwitch() {
  const [checked, setChecked] = useState(false);
  return <Switch checked={checked} onCheckedChange={setChecked} aria-label="Toggle" />;
}

function StatesSwitch() {
  const [on, setOn] = useState(false);
  return (
    <Stack gap="4">
      <Inline gap="2" wrap>
        <Switch checked={on} onCheckedChange={setOn} aria-label="Off" />
        <Switch checked={!on} onCheckedChange={() => setOn(!on)} aria-label="On" />
      </Inline>
      <Switch checked={false} onCheckedChange={() => {}} disabled aria-label="Disabled" />
    </Stack>
  );
}

export const Default: Story = {
  render: () => <DefaultSwitch />,
};

export const States: Story = {
  render: () => <StatesSwitch />,
};
