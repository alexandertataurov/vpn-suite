import type { Meta, StoryObj } from "@storybook/react";
import { DropdownMenu } from "./DropdownMenu";
import { Button } from "../buttons/Button";

const meta: Meta<typeof DropdownMenu> = {
  title: "Shared/Components/DropdownMenu",
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

export const DropdownMenuDefault: Story = {
  args: {
    trigger: <Button variant="secondary">Open menu</Button>,
    items,
  },
};

export const DropdownMenuOverview: Story = {
  args: {
    trigger: <Button variant="secondary">Open menu</Button>,
    items,
  },
};

export const DropdownMenuVariants: Story = {
  render: () => (
    <div className="sb-row">
      <DropdownMenu trigger={<Button variant="secondary">Default</Button>} items={items} />
      <DropdownMenu trigger={<Button variant="ghost">Ghost</Button>} items={items} />
    </div>
  ),
};

export const DropdownMenuSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; use Button size for trigger.</p>
      <DropdownMenu trigger={<Button variant="secondary" size="sm">Open menu</Button>} items={items} />
    </div>
  ),
};

export const DropdownMenuStates: Story = {
  render: () => (
    <DropdownMenu trigger={<Button variant="secondary">Open menu</Button>} items={items} />
  ),
};

export const DropdownMenuWithLongText: Story = {
  args: {
    trigger: <Button variant="secondary">Open menu</Button>,
    items: [
      { id: "rename", label: "Rename server with long label", onClick: () => {} },
      { id: "delete", label: "Delete", onClick: () => {}, danger: true },
    ],
  },
};

export const DropdownMenuDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: {
    trigger: <Button variant="secondary">Open menu</Button>,
    items,
  },
};

export const DropdownMenuAccessibility: Story = {
  args: {
    trigger: <Button variant="secondary">Open menu</Button>,
    items,
  },
};

export const DropdownMenuEdgeCases = WithLongText;
