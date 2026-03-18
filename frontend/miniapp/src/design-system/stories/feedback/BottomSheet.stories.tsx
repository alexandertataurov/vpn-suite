import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/design-system";
import { StorySection, StoryShowcase } from "@/design-system";

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
    <StoryShowcase>
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
    </StoryShowcase>
  );
}

export const Default: Story = {
  render: () => (
    <StorySection title="Interactive" description="Click to open. Swipe or tap outside to close.">
      <BottomSheetDemo />
    </StorySection>
  ),
};

export const ConfirmFlow: Story = {
  render: () => (
    <StorySection title="Confirm flow" description="Primary and secondary actions.">
      <BottomSheetConfirmDemo />
    </StorySection>
  ),
};

function BottomSheetConfirmDemo() {
  const [open, setOpen] = useState(false);
  return (
    <StoryShowcase>
      <Button onClick={() => setOpen(true)}>Confirm action</Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Save changes?"
        bodyText="Your changes will be saved. You can edit them later."
        primaryLabel="Save"
        secondaryLabel="Cancel"
        onPrimary={() => setOpen(false)}
        onSecondary={() => setOpen(false)}
      />
    </StoryShowcase>
  );
}
