import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Drawer } from "./Drawer";
import { Button } from "../buttons/Button";

const meta: Meta<typeof Drawer> = {
  title: "Shared/Components/Drawer",
  component: Drawer,
  parameters: {
    docs: {
      description: {
        component: "Slide-in panel for detail views, forms. Slides from right. Focus trap, Escape to close.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Drawer>;

function DrawerDemo({ open: initial }: { open?: boolean }) {
  const [open, setOpen] = useState(!!initial);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Drawer title">
        <p>Drawer content.</p>
      </Drawer>
    </>
  );
}

export const DrawerOverview: Story = {
  render: () => <DrawerDemo open />,
};

export const DrawerVariants: Story = {
  render: () => <DrawerDemo open />,
};

export const DrawerSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; width is tokenized.</p>
      <DrawerDemo open />
    </div>
  ),
};

export const DrawerStates: Story = {
  render: () => <DrawerDemo open />,
};

export const DrawerWithLongText: Story = {
  render: () => (
    <Drawer open onClose={() => {}} title="Long drawer title for server details">
      <p>Long body copy that should wrap and remain readable without overflowing the drawer container.</p>
    </Drawer>
  ),
};

export const DrawerDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => <DrawerDemo open />,
};

export const DrawerAccessibility: Story = {
  render: () => <DrawerDemo open />,
};

export const DrawerEdgeCases = WithLongText;
