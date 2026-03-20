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
          "Dropdown select with options. Supports label, error, loading, and empty states for list-based choices.",
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
  parameters: {
    docs: {
      description: {
        story:
          "Interactive server selector using a real option list. This is the default select contract.",
      },
    },
  },
  render: () => (
    <StorySection title="Interactive" description="Select a server from the option list.">
      <StoryShowcase>
        <SelectDemo />
      </StoryShowcase>
    </StorySection>
  ),
};

export const States: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Error, loading, empty, and disabled states shown together for quick contract review.",
      },
    },
  },
  render: () => (
    <StorySection title="States" description="Error, loading, empty, and disabled states.">
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
  parameters: {
    docs: {
      description: {
        story:
          "Select rendered alongside another field so spacing and label alignment can be reviewed together.",
      },
    },
  },
  render: () => (
    <StorySection title="In form context" description="With a text field above it.">
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
