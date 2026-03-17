import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Input } from "./Input";

const meta = {
  title: "Components/Input/Interactions",
  component: Input,
  tags: ["autodocs", "contract-test"],
  parameters: {
    docs: {
      description: {
        component: "Executable interaction contract for focus and typing behavior in the mobile input primitive.",
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

function ControlledInputDemo() {
  const [value, setValue] = useState("");

  return (
    <Input
      id="storybook-input-interactions"
      label="Device name"
      value={value}
      onChange={(event) => setValue(event.currentTarget.value)}
      placeholder="e.g. MacBook Air"
    />
  );
}

export const FocusAndType: Story = {
  render: () => <ControlledInputDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Device name");
    const input = canvas.getByLabelText("Device name");

    await userEvent.click(label);
    await expect(input).toHaveFocus();

    await userEvent.type(input, "Pixel 9 Pro");
    await expect(input).toHaveValue("Pixel 9 Pro");
  },
};
