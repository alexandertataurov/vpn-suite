import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/design-system";

const meta = {
  title: "Components/BottomSheet",
  tags: ["autodocs"],
  component: BottomSheet,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Sheet-style confirmation dialog. Primary and secondary actions. Uses design tokens.",
      },
    },
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

function BottomSheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm action"
        bodyText="Are you sure you want to proceed?"
        primaryLabel="Confirm"
        secondaryLabel="Cancel"
        onPrimary={() => setOpen(false)}
        onSecondary={() => setOpen(false)}
      />
    </>
  );
}

export const Default: Story = {
  render: () => <BottomSheetDemo />,
};
