import type { ComponentType } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Toast, ToastContainer, ToastViewport, type ToastItem } from "@/design-system/components/feedback/Toast";
import { useToast } from "@/design-system/components/feedback/useToast";
import { Button } from "@/design-system";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const PLAYGROUND_TOAST: ToastItem = {
  id: "toast-story-playground",
  message: "Tunnel updated. Your current route will switch on the next reconnect.",
  variant: "info",
  duration: 5000,
  dismissible: false,
};

const STORY_TOASTS: ToastItem[] = [
  {
    id: "toast-story-success",
    message: "Backup server selected and ready for new sessions.",
    variant: "success",
    duration: 4000,
    dismissible: false,
  },
  {
    id: "toast-story-error",
    message: "Could not refresh the tunnel list. Pull to retry in a moment.",
    variant: "error",
    duration: 8000,
    dismissible: true,
  },
  {
    id: "toast-story-persistent",
    message: "Connection handoff in progress. Keep the app open until migration finishes.",
    variant: "persistent",
    duration: 0,
    dismissible: true,
  },
];

const meta = {
  title: "Components/Toast",
  tags: ["autodocs"],
  component: Toast,
  args: {
    message: PLAYGROUND_TOAST.message,
    variant: PLAYGROUND_TOAST.variant,
    duration: PLAYGROUND_TOAST.duration,
    dismissible: PLAYGROUND_TOAST.dismissible,
    exiting: false,
    stackIndex: 0,
    stackCount: 1,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["success", "error", "info", "persistent"],
      table: { category: "Appearance" },
    },
    duration: {
      control: "number",
      table: { category: "Behavior" },
    },
    dismissible: {
      control: "boolean",
      table: { category: "Behavior" },
    },
    exiting: {
      control: "boolean",
      table: { category: "State" },
    },
    message: {
      control: "text",
      table: { category: "Content" },
    },
    onDismiss: { table: { disable: true } },
    className: { table: { disable: true } },
    stackIndex: { table: { disable: true } },
    stackCount: { table: { disable: true } },
  },
  decorators: [
    (Story: ComponentType) => (
      <ToastContainer viewportClassName="toast-story-viewport">
        <div className="toast-story-frame">
          <Story />
        </div>
      </ToastContainer>
    ),
  ],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Ephemeral notification for feedback after user actions. Variants: success, error, info, persistent. Use toast for short, non-blocking updates; use inline alerts or modal surfaces when the message needs to stay visible or asks the user to decide.",
      },
    },
    status: { type: "stable" },
  },
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

function ToastTriggerPanel() {
  const { addToast } = useToast();

  return (
    <div className="toast-story-surface">
      <div className="layout-story-inline layout-story-inline--tight">
        <Button
          className="toast-story-trigger-primary"
          onClick={() => addToast({ message: "Changes saved to your active device profile.", variant: "info" })}
        >
          Show info toast
        </Button>
        <Button
          className="toast-story-trigger-secondary"
          onClick={() => addToast({ message: "Secure route updated successfully.", variant: "success" })}
        >
          Success
        </Button>
        <Button
          className="toast-story-trigger-secondary"
          onClick={() => addToast({ message: "Could not sync the tunnel heartbeat.", variant: "error" })}
        >
          Error
        </Button>
        <Button
          className="toast-story-trigger-secondary"
          onClick={() =>
            addToast({
              message: "Migration in progress. Stay on this screen until the node switch completes.",
              variant: "persistent",
            })
          }
        >
          Persistent
        </Button>
      </div>
    </div>
  );
}

function ToastStaticPreview() {
  return (
    <div className="toast-story-surface">
      <ToastViewport toasts={STORY_TOASTS} className="toast-story-static-stack" />
    </div>
  );
}

function ToastStackingDemo() {
  const { addToast } = useToast();

  return (
    <Button
      onClick={() => {
        addToast({ message: "Node assignment updated.", variant: "info" });
        setTimeout(() => addToast({ message: "Fallback route now active.", variant: "success" }), 300);
        setTimeout(() => addToast({ message: "Background sync paused on weak signal.", variant: "persistent" }), 600);
      }}
    >
      Trigger 3 toasts
    </Button>
  );
}

export const Playground: Story = {
  name: "Playground",
  parameters: {
    docs: {
      description: {
        story:
          "Single-toast viewport preview with controls. Use this as the main sandbox for message length, semantic tone, dismiss behavior, and progress timing before checking the scenario stories below.",
      },
    },
  },
  render: (args) => (
    <StorySection title="Playground" description="Single-toast preview with controls for tone, copy, and duration.">
      <StoryShowcase>
        <div className="toast-story-surface">
          <ToastViewport
            toasts={[
              {
                id: "toast-story-preview",
                message: args.message ?? PLAYGROUND_TOAST.message,
                variant: args.variant ?? PLAYGROUND_TOAST.variant,
                duration: args.duration ?? PLAYGROUND_TOAST.duration,
                dismissible: args.dismissible ?? PLAYGROUND_TOAST.dismissible,
                exiting: args.exiting ?? false,
              },
            ]}
            className="toast-story-static-stack"
          />
        </div>
      </StoryShowcase>
    </StorySection>
  ),
};

export const States: Story = {
  name: "States",
  parameters: {
    docs: {
      description: {
        story:
          "Static stack of common variants for reviewing layout, label chips, dismiss affordance, and multiline copy without waiting on timers.",
      },
    },
  },
  render: () => (
    <StorySection title="States" description="Static stack of common toast variants.">
      <StoryShowcase>
        <ToastStaticPreview />
      </StoryShowcase>
    </StorySection>
  ),
};

export const Triggers: Story = {
  name: "Triggers",
  parameters: {
    docs: {
      description: {
        story:
          "Interactive toast triggers using the live context provider. Use this to verify trigger behavior, timing, insertion order, and dismissal in an in-flow Storybook viewport.",
      },
    },
  },
  render: () => (
    <StorySection title="Triggers" description="Trigger live toasts inside a miniapp-sized preview surface.">
      <StoryShowcase>
        <ToastTriggerPanel />
      </StoryShowcase>
    </StorySection>
  ),
};

export const Stacking: Story = {
  name: "Stacking",
  parameters: {
    docs: {
      description: {
        story:
          "Sequential trigger scenario for verifying stack compression, mixed persistent and ephemeral states, and how the viewport expands under load.",
      },
    },
  },
  render: () => (
    <StorySection title="Stacking" description="Trigger several toasts in sequence.">
      <StoryShowcase>
        <StoryStack>
          <ToastTriggerPanel />
          <ToastStackingDemo />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
