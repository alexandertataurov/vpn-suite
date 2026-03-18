import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "./Modal";
import { Button, Text } from "@/design-system";
import { StorySection, StoryShowcase } from "@/design-system";

const meta = {
  title: "Components/Modal",
  tags: ["autodocs"],
  component: Modal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Overlay dialog. Variants: plain, confirm, danger. Supports swipe-to-dismiss, Escape. Uses design tokens.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["plain", "confirm", "danger"] },
  },
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

function ModalTriggerDemo({
  variant = "plain",
  title,
  description,
}: {
  variant?: "plain" | "confirm" | "danger";
  title: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        variant={variant}
      >
        <Text variant="body-sm">Modal content goes here.</Text>
      </Modal>
    </>
  );
}

export const Default: Story = {
  render: () => (
    <StorySection title="Interactive" description="Click to open. Escape or backdrop to close.">
      <StoryShowcase>
        <ModalTriggerDemo title="Modal title" />
      </StoryShowcase>
    </StorySection>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="plain, confirm, danger.">
      <StoryShowcase>
        <div className="story-stack">
          <Modal
            open
            onClose={() => {}}
            title="Plain modal"
            variant="plain"
            inline
          >
            <Text variant="body-sm">Content for plain modal.</Text>
          </Modal>
          <Modal
            open
            onClose={() => {}}
            title="Confirm action"
            description="This action cannot be undone."
            variant="confirm"
            inline
          >
            <Text variant="body-sm">Confirm flow content.</Text>
          </Modal>
          <Modal
            open
            onClose={() => {}}
            title="Delete account"
            description="This will permanently remove your account."
            variant="danger"
            inline
          >
            <Text variant="body-sm">Danger flow content.</Text>
          </Modal>
        </div>
      </StoryShowcase>
    </StorySection>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <StorySection title="With description" description="Title and description for confirm flows.">
      <Modal
        open
        onClose={() => {}}
        title="Confirm action"
        description="This action cannot be undone. Please review before continuing."
        inline
      >
        <Text variant="body-sm">Modal body content.</Text>
      </Modal>
    </StorySection>
  ),
};

export const Inline: Story = {
  render: () => (
    <StorySection title="Inline preview" description="Static preview for design review.">
      <Modal open onClose={() => {}} title="Inline preview" inline>
        <Text variant="body-sm">Rendered inline for static Storybook mockup.</Text>
      </Modal>
    </StorySection>
  ),
};
