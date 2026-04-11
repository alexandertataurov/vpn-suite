import type { Meta, StoryObj } from "@storybook/react";
import { useArgs } from "storybook/preview-api";
import { Select } from "@/design-system/components/forms/Select";
import { Input, StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta = {
  title: "Components/Select",
  tags: ["autodocs"],
  component: Select,
  args: {
    label: "Server",
    placeholder: "Choose server",
    value: "amsterdam",
  },
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Dropdown select with options. Supports label, error, loading, and empty states for list-based choices.",
      },
    },
  },
  argTypes: {
    label: { control: "text", table: { category: "Content" } },
    placeholder: { control: "text", table: { category: "Content" } },
    value: {
      control: "select",
      options: ["", "amsterdam", "frankfurt", "paris", "london"],
      table: { category: "State" },
    },
    description: { control: "text", table: { category: "Content" } },
    error: { control: "text", table: { category: "State" } },
    success: { control: "text", table: { category: "State" } },
    loading: { control: "boolean", table: { category: "State" } },
    disabled: { control: "boolean", table: { category: "State" } },
    loadingLabel: { control: "text", table: { category: "Content" } },
    emptyLabel: { control: "text", table: { category: "Content" } },
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

export const Default: Story = {
  args: {
    label: "Server",
    placeholder: "Choose server",
    value: "amsterdam",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Baseline select contract with a populated option list. Use the controls here to review label, placeholder, selected value, and helper states.",
      },
    },
  },
  render: (args) => (
    <StorySection title="Default" description="Baseline select contract with a populated option list.">
      <StoryShowcase>
        <Select {...args} options={SERVER_OPTIONS} onChange={() => {}} />
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

export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Interactive selector scenario for checking menu behavior and selected-value rendering against a real option list.",
      },
    },
  },
  render: function InteractiveStory(args) {
    const [{ value }, updateArgs] = useArgs();
    return (
      <StorySection title="Interactive" description="Open the menu and switch between real server options.">
        <StoryShowcase>
          <Select
            {...args}
            options={SERVER_OPTIONS}
            value={typeof value === "string" ? value : ""}
            onChange={(nextValue) => updateArgs({ value: nextValue })}
          />
        </StoryShowcase>
      </StorySection>
    );
  },
};
