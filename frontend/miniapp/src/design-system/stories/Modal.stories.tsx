import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal, ConfirmModal, ConfirmDanger, Button } from "../components";

const meta = {
  title: "Design System/Components/Modal",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: { component: "Modal, ConfirmModal, ConfirmDanger. Use for dialogs and confirmations." },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function ModalTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Modal title" description="Modal description">
        <p>Modal body content.</p>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </Modal>
    </>
  );
}

export const Default: Story = {
  render: () => <ModalTrigger />,
};

export const Confirm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Confirm</Button>
        <ConfirmModal
          open={open}
          onClose={() => setOpen(false)}
          title="Confirm action"
          message="Are you sure you want to continue?"
          confirmLabel="Continue"
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};

export const Danger: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>Delete</Button>
        <ConfirmDanger
          open={open}
          onClose={() => setOpen(false)}
          title="Delete item"
          message="This cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};
