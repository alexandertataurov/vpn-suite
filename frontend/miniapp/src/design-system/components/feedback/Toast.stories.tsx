import type { Meta, StoryObj } from "@storybook/react";
import { Toast, ToastContainer, ToastViewport, useToast } from "./Toast";
import { Button } from "@/design-system";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

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
    <StoryShowcase>
      <StoryStack>
        <Button onClick={() => toast("Changes saved")}>Show info toast</Button>
        <Button onClick={() => toast({ message: "Connected successfully", variant: "success" })}>
          Success
        </Button>
        <Button onClick={() => toast({ message: "Connection failed", variant: "error" })}>
          Error
        </Button>
      </StoryStack>
      <ToastContainer>
        <ToastViewport />
      </ToastContainer>
    </StoryShowcase>
  );
}

export const Default: Story = {
  render: () => (
    <StorySection title="Interactive" description="Click to trigger toasts.">
      <ToastDemo />
    </StorySection>
  ),
};

function ToastVariantsDemo() {
  const { toast } = useToast();
  return (
    <>
      <StoryStack>
        <Button onClick={() => toast({ message: "Success", variant: "success" })}>
          Success
        </Button>
        <Button onClick={() => toast({ message: "Error", variant: "error" })}>
          Error
        </Button>
        <Button onClick={() => toast({ message: "Info", variant: "info" })}>
          Info
        </Button>
        <Button onClick={() => toast({ message: "Persistent (no auto-dismiss)", variant: "persistent" })}>
          Persistent
        </Button>
      </StoryStack>
      <ToastContainer>
        <ToastViewport />
      </ToastContainer>
    </>
  );
}

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="success, error, info, persistent.">
      <StoryShowcase>
        <ToastVariantsDemo />
      </StoryShowcase>
    </StorySection>
  ),
};

export const Stacking: Story = {
  render: () => (
    <StorySection title="Stacking" description="Trigger multiple toasts.">
      <StoryShowcase>
        <ToastStackingDemo />
      </StoryShowcase>
    </StorySection>
  ),
};

function ToastStackingDemo() {
  const { toast } = useToast();
  return (
    <>
      <Button
        onClick={() => {
          toast({ message: "First toast", variant: "info" });
          setTimeout(() => toast({ message: "Second toast", variant: "success" }), 300);
          setTimeout(() => toast({ message: "Third toast", variant: "info" }), 600);
        }}
      >
        Trigger 3 toasts
      </Button>
      <ToastContainer>
        <ToastViewport />
      </ToastContainer>
    </>
  );
}
