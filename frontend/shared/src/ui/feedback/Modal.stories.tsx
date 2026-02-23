import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Modal, ConfirmModal, ConfirmDanger } from "./Modal";
import { Button } from "../buttons/Button";

const meta: Meta<typeof Modal> = {
  title: "Components/Modal",
  component: Modal,
  parameters: {
    docs: {
      description: {
        component: `Dialog overlay. ConfirmModal for confirm/cancel; ConfirmDanger for destructive.

**Purpose:** Focused tasks, confirmations. Don't stack modals.

**States:** Open, closing. Focus trap; Escape closes.

**Accessibility:** aria-modal, focus management. **Do:** One primary action. **Don't:** Long forms in modal.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Modal>;

function ModalDemo({ open: initial }: { open?: boolean }) {
  const [open, setOpen] = useState(!!initial);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Modal title">
        <p>Modal content goes here.</p>
      </Modal>
    </>
  );
}

export const Overview: Story = {
  render: () => <ModalDemo open />,
};

export const Variants: Story = {
  render: function ConfirmStory() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Confirm</Button>
        <ConfirmModal
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => {}}
          title="Confirm action"
          message="Are you sure?"
        />
      </>
    );
  },
};

export const States: Story = {
  render: function DangerStory() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>Delete</Button>
        <ConfirmDanger
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => {}}
          title="Delete item"
          message="This cannot be undone."
        />
      </>
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; modal width is tokenized.</p>
      <ModalDemo open />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <Modal open onClose={() => {}} title="Long modal title for environment maintenance window">
      <p>Long body copy that should wrap and remain readable without overflowing the modal container.</p>
    </Modal>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => <ModalDemo open />,
};

export const Accessibility: Story = {
  render: () => <ModalDemo open />,
};

export const EdgeCases = WithLongText;
