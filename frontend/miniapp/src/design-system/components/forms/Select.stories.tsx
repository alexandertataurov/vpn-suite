import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Select } from "./Select";
import { Stack } from "@/design-system/core/primitives";

const meta = {
  title: "Components/Select",
  tags: ["autodocs"],
  component: Select,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Dropdown select with options. Supports label, error, loading, empty state. Uses design tokens.",
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { value: "amsterdam", label: "Amsterdam" },
  { value: "frankfurt", label: "Frankfurt" },
  { value: "paris", label: "Paris" },
];

function SelectDemo() {
  const [value, setValue] = useState("amsterdam");
  return (
    <Select
      options={OPTIONS}
      value={value}
      onChange={setValue}
      label="Server"
      placeholder="Choose server"
    />
  );
}

export const Default: Story = {
  render: () => <SelectDemo />,
};

export const WithLabel: Story = {
  render: () => (
    <Select
      options={OPTIONS}
      value=""
      onChange={() => {}}
      label="Region"
      placeholder="Select region"
    />
  ),
};

export const WithError: Story = {
  render: () => (
    <Select
      options={OPTIONS}
      value=""
      onChange={() => {}}
      label="Server"
      error="Required"
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select
      options={OPTIONS}
      value="amsterdam"
      onChange={() => {}}
      label="Server"
      disabled
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <Select
      options={[]}
      value=""
      onChange={() => {}}
      label="Server"
      loading
      loadingLabel="Loading servers…"
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <Select
      options={[]}
      value=""
      onChange={() => {}}
      label="Region"
      emptyLabel="No regions available"
    />
  ),
};
