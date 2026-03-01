import type { Meta, StoryObj } from "@storybook/react";
import { ToastContainer, useToast } from "@/design-system";
import { Button } from "@/design-system";

function ToastDemo() {
  const { addToast } = useToast();
  return (
    <div className="sb-row sb-row-tight">
      <Button onClick={() => addToast("Operation completed", "success")}>Success</Button>
      <Button variant="danger" onClick={() => addToast("Something went wrong", "error")}>
        Error
      </Button>
      <Button variant="secondary" onClick={() => addToast("Here's some information", "info")}>
        Info
      </Button>
    </div>
  );
}

const meta: Meta<typeof ToastContainer> = {
  title: "Primitives/Toast-Alert/Toast",
  component: ToastContainer,
  parameters: {
    docs: {
      description: {
        component: `Toast notifications via useToast() inside ToastContainer.

**Purpose:** Transient feedback. Don't use for critical errors (use InlineAlert).

**Variants:** success, error, info. Auto-dismiss.

**Accessibility:** role="alert". **Do:** Keep messages short. **Don't:** Stack many toasts.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ToastContainer>;

export const Overview: Story = {
  render: () => <ToastDemo />,
};

export const Variants: Story = {
  render: () => <ToastDemo />,
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; toasts are token-sized.</p>
      <ToastDemo />
    </div>
  ),
};

export const States: Story = {
  render: () => <ToastDemo />,
};

export const WithLongText: Story = {
  render: () => {
    const Demo = () => {
      const { addToast } = useToast();
      return (
        <Button onClick={() => addToast("Long message: telemetry stream degraded across multiple regions and will retry automatically.", "info")}>
          Show long toast
        </Button>
      );
    };
    return <Demo />;
  },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => <ToastDemo />,
};

export const Accessibility: Story = {
  render: () => <ToastDemo />,
};

export const EdgeCases = WithLongText;
