import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Drawer } from "@/design-system";
import { Button } from "@/design-system";

const meta: Meta<typeof Drawer> = {
  title: "Components/Drawer",
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

export const Overview: Story = {
  render: () => <DrawerDemo open />,
};

export const Variants: Story = {
  render: () => <DrawerDemo open />,
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; width is tokenized.</p>
      <DrawerDemo open />
    </div>
  ),
};

export const States: Story = {
  render: () => <DrawerDemo open />,
};

export const WithLongText: Story = {
  render: () => (
    <Drawer open onClose={() => {}} title="Long drawer title for server details">
      <p>Long body copy that should wrap and remain readable without overflowing the drawer container.</p>
    </Drawer>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => <DrawerDemo open />,
};

export const Accessibility: Story = {
  render: () => <DrawerDemo open />,
};

export const EdgeCases = WithLongText;
