import type { Meta, StoryObj } from "@storybook/react";
import { Toast, ToastContainer, ToastViewport, useToast } from "./Toast";
import { Button } from "@/design-system/components/Button";
import { Stack } from "@/design-system/core/primitives";

const meta = {
  title: "Components/Toast",
  tags: ["autodocs"],
  component: Toast,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Ephemeral notification. Variants: success, error, info, persistent. Uses design tokens.",
      },
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

function ToastDemo() {
  const { toast } = useToast();
  return (
    <Stack gap="4">
      <Button onClick={() => toast("Toast message")}>Show toast</Button>
      <Button onClick={() => toast({ message: "Success", variant: "success" })}>
        Success
      </Button>
      <Button onClick={() => toast({ message: "Error", variant: "error" })}>
        Error
      </Button>
      <ToastContainer>
        <ToastViewport />
      </ToastContainer>
    </Stack>
  );
}

export const Default: Story = {
  render: () => <ToastDemo />,
};
