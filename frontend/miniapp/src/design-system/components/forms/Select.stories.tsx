import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Select } from "./Select";
import { Input, StorySection, StoryShowcase, StoryStack } from "@/design-system";

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
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

const SERVER_OPTIONS = [
  { value: "amsterdam", label: "Amsterdam" },
  { value: "frankfurt", label: "Frankfurt" },
  { value: "paris", label: "Paris" },
  { value: "london", label: "London" },
];

function SelectDemo() {
  const [value, setValue] = useState("amsterdam");
  return (
    <Select
      options={SERVER_OPTIONS}
      value={value}
      onChange={setValue}
      label="Server"
      placeholder="Choose server"
    />
  );
}

export const Default: Story = {
  render: () => (
    <StorySection title="Interactive" description="Select a server.">
      <StoryShowcase>
        <SelectDemo />
      </StoryShowcase>
    </StorySection>
  ),
};

export const States: Story = {
  render: () => (
    <StorySection title="States" description="Error, loading, empty, disabled.">
      <StoryShowcase>
        <StoryStack>
          <Select
            options={SERVER_OPTIONS}
            value=""
            onChange={() => {}}
            label="Server"
            error="Please select a server"
          />
          <Select
            options={[]}
            value=""
            onChange={() => {}}
            label="Server"
            loading
            loadingLabel="Loading servers…"
          />
          <Select
            options={[]}
            value=""
            onChange={() => {}}
            label="Region"
            emptyLabel="No regions available"
          />
          <Select
            options={SERVER_OPTIONS}
            value="amsterdam"
            onChange={() => {}}
            label="Server"
            disabled
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const FormContext: Story = {
  render: () => (
    <StorySection title="In form context" description="With other fields.">
      <StoryShowcase>
        <StoryStack>
          <Input label="Email" placeholder="you@example.com" type="email" />
          <Select
            options={SERVER_OPTIONS}
            value="amsterdam"
            onChange={() => {}}
            label="Server"
            placeholder="Choose server"
          />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
