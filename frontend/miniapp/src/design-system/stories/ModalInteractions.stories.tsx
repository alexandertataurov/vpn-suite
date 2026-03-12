import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Button, Modal } from "../components";

const meta = {
  title: "Components/Modal/Interactions",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Executable interaction contract for opening and closing the standard modal surface.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function ModalInteractionDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Session details"
        description="Custom content goes in the body slot and footer actions stay pinned."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </>
        }
      >
        <p className="modal-message">Connection guidance lives here.</p>
      </Modal>
    </>
  );
}

export const OpenAndClose: Story = {
  render: () => <ModalInteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /open modal/i });

    await userEvent.click(trigger);
    await expect(canvas.getByRole("dialog", { name: /session details/i })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: /done/i }));
    await expect(canvas.queryByRole("dialog", { name: /session details/i })).not.toBeInTheDocument();
  },
};
