import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" },
];

const meta: Meta<typeof Select> = {
  title: "Primitives/Select",
  component: Select,
  parameters: {
    docs: {
      description: {
        component: `Single-choice dropdown select.

**Purpose:** Single selection from list. Don't use for multi-select.

**States:** Default, open, disabled. **Accessibility:** Label, keyboard nav.

**Do:** Use options array. **Don't:** Long option lists (consider search).`,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Overview: Story = {
  args: {
    options,
    value: "b",
    onChange: () => {},
    label: "Choose option",
  },
};

export const Variants: Story = {
  render: () => (
    <div className="sb-stack">
      <Select options={options} value="a" onChange={() => {}} label="Default" />
      <Select options={options} value="b" onChange={() => {}} label="Secondary" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; use tokens for density.</p>
      <Select options={options} value="b" onChange={() => {}} label="Choose option" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="sb-stack">
      <Select options={options} value="a" onChange={() => {}} label="Default" />
      <Select options={options} value="" onChange={() => {}} label="With error" error="Please select" />
      <Select options={options} value="b" onChange={() => {}} label="Disabled" disabled />
    </div>
  ),
};

/** Error state: validation error */
export const Error: Story = {
  args: { options, value: "", onChange: () => {}, label: "Region", error: "Please select a region" },
};

/** Empty state: no options available */
export const Empty: Story = {
  args: { options: [], value: "", onChange: () => {}, label: "No options" },
};

/** Loading simulation: disabled while fetching options */
export const Loading: Story = {
  args: { options: [{ value: "", label: "Loading..." }], value: "", onChange: () => {}, label: "Region", disabled: true },
};

export const WithLongText: Story = {
  args: {
    options: [
      { value: "long", label: "Long option label that should wrap on small screens" },
      ...options,
    ],
    value: "long",
    onChange: () => {},
    label: "Long label for select input",
  },
};

export const Accessibility: Story = {
  args: {
    options,
    value: "c",
    onChange: () => {},
    label: "Accessible select",
  },
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { options, value: "b", onChange: () => {}, label: "Choose option" },
};

export const EdgeCases = WithLongText;
