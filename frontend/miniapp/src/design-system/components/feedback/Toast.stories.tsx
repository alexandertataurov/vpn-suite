import type { Meta, StoryObj } from "@storybook/react";
import { Toast, ToastContainer, ToastViewport, useToast } from "./Toast";
import { Button } from "@/design-system/components/Button";

const meta = {
  title: "Components/Toast",
  tags: ["autodocs"],
  component: Toast,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

function ToastDemo() {
  const { toast } = useToast();
  return (
    <>
      <Button
        onClick={() =>
          toast({ title: "Toast title", description: "Toast description" })
        }
      >
        Show toast
      </Button>
      <ToastContainer>
        <ToastViewport />
      </ToastContainer>
    </>
  );
}

export const Default: Story = {
  render: () => <ToastDemo />,
};
