import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button } from "../components/buttons/Button";

const meta = {
  title: "Components/Button/Interactions",
  component: Button,
  tags: ["autodocs", "contract-test"],
  args: {
    children: "Continue",
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        component: "Executable interaction contract for the base button primitive.",
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Clickable: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /continue/i });

    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
