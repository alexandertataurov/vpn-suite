import type { Meta, StoryObj } from "@storybook/react";
import { DropdownMenu } from "@/design-system";
import { Button } from "@/design-system";

const meta: Meta<typeof DropdownMenu> = {
  title: "Components/DropdownMenu",
  component: DropdownMenu,
  parameters: {
    docs: {
      description: {
        component: "Context menu triggered by button. Items: label, onClick, danger. Closes on select or outside click.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DropdownMenu>;

const items = [
  { id: "edit", label: "Edit", onClick: () => {} },
  { id: "delete", label: "Delete", onClick: () => {}, danger: true },
];

export const Default: Story = {
  args: {
    trigger: <Button variant="secondary">Open menu</Button>,
    items,
  },
};

export const Overview: Story = {
  args: {
    trigger: <Button variant="secondary">Open menu</Button>,
    items,
  },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-row">
      <DropdownMenu trigger={<Button variant="secondary">Default</Button>} items={items} />
      <DropdownMenu trigger={<Button variant="ghost">Ghost</Button>} items={items} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; use Button size for trigger.</p>
      <DropdownMenu trigger={<Button variant="secondary" size="sm">Open menu</Button>} items={items} />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <DropdownMenu trigger={<Button variant="secondary">Open menu</Button>} items={items} />
  ),
};

export const WithLongText: Story = {
  args: {
    trigger: <Button variant="secondary">Open menu</Button>,
    items: [
      { id: "rename", label: "Rename server with long label", onClick: () => {} },
      { id: "delete", label: "Delete", onClick: () => {}, danger: true },
    ],
  },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: {
    trigger: <Button variant="secondary">Open menu</Button>,
    items,
  },
};

export const Accessibility: Story = {
  args: {
    trigger: <Button variant="secondary">Open menu</Button>,
    items,
  },
};

export const EdgeCases = WithLongText;
