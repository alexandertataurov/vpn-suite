import type { Meta, StoryObj } from "@storybook/react";
import { Button, Select } from "@/design-system";
import { Toolbar } from "./toolbar/Toolbar";

const meta: Meta<typeof Toolbar> = {
  title: "Patterns/OperatorToolbar",
  component: Toolbar,
};

export default meta;

type Story = StoryObj<typeof Toolbar>;

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "health", label: "Health" },
];

export const Overview: Story = {
  render: () => (
    <Toolbar>
      <Button variant="secondary" size="sm">Refresh</Button>
      <Button variant="secondary" size="sm">Export</Button>
    </Toolbar>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <Toolbar>
        <Button variant="secondary" size="sm">Refresh</Button>
        <Button variant="ghost" size="sm">Settings</Button>
      </Toolbar>
      <Toolbar>
        <Select options={sortOptions} value="name" onChange={() => {}} aria-label="Sort" />
        <Button variant="secondary" size="sm">Apply</Button>
      </Toolbar>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Toolbar sizing follows contained controls.</p>
      <Toolbar>
        <Button variant="secondary" size="sm">Action</Button>
      </Toolbar>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <Toolbar>
      <Button variant="secondary" size="sm" disabled>Disabled</Button>
      <Button variant="secondary" size="sm">Default</Button>
    </Toolbar>
  ),
};

export const WithLongText: Story = {
  render: () => (
    <Toolbar>
      <Button variant="secondary" size="sm">Long action label that should wrap</Button>
      <Button variant="ghost" size="sm">Secondary</Button>
    </Toolbar>
  ),
};

export const EdgeCases = WithLongText;

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <Toolbar>
      <Button variant="secondary" size="sm">Refresh</Button>
      <Button variant="ghost" size="sm">Settings</Button>
    </Toolbar>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <Toolbar>
      <Button variant="secondary" size="sm" aria-label="Refresh">Refresh</Button>
      <Button variant="ghost" size="sm" aria-label="Settings">Settings</Button>
    </Toolbar>
  ),
};
