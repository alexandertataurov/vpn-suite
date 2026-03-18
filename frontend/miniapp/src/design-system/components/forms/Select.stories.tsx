import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Select } from "./Select";

const meta = {
  title: "Components/Select",
  tags: ["autodocs"],
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

const options = [
  { value: "amsterdam", label: "Amsterdam" },
  { value: "frankfurt", label: "Frankfurt" },
  { value: "paris", label: "Paris" },
];

function SelectDemo() {
  const [value, setValue] = useState("amsterdam");
  return (
    <Select
      options={options}
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
      options={options}
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
      options={options}
      value=""
      onChange={() => {}}
      label="Server"
      error="Required"
    />
  ),
};
