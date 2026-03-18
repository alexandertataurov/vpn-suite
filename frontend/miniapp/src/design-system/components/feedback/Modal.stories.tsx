import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "@/design-system/components/Button";
import { Text } from "@/design-system/core/primitives";

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
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Modal title">
        <Text variant="body-sm">Modal content.</Text>
      </Modal>
    </>
  );
}

export const Default: Story = {
  render: () => <ModalDemo />,
};

export const Inline: Story = {
  render: () => (
    <Modal
      open
      onClose={() => {}}
      title="Inline preview"
      inline
    >
      <Text variant="body-sm">Rendered inline for static Storybook mockup.</Text>
    </Modal>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Modal
      open
      onClose={() => {}}
      title="Confirm action"
      description="This action cannot be undone."
      inline
    >
      <Text variant="body-sm">Modal content.</Text>
    </Modal>
  ),
};
