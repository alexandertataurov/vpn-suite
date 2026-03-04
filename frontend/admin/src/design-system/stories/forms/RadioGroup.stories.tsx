import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { RadioGroup } from "@/design-system";

function StatefulRadioGroup(props: Omit<Parameters<typeof RadioGroup>[0], "value" | "onChange"> & { initialValue?: string }) {
  const [value, setValue] = useState(props.initialValue ?? "");
  return <RadioGroup {...props} value={value} onChange={setValue} />;
}

const meta: Meta<typeof RadioGroup> = {
  title: "UI/Components/Inputs/RadioGroup",
  component: RadioGroup,
  tags: ["a11y", "interaction"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "Single-choice selection. Choose exactly one from a small set (2–6). Vertical or horizontal layout.",
          "## When to use",
          "2–6 mutually exclusive options. Settings, filters (e.g. region, density).",
          "## When NOT to use",
          "Many options (use Select). Toggle/boolean (use Checkbox/Toggle).",
          "## Anatomy",
          "Fieldset, legend (label), radio options (value, label, optional description), optional error/description.",
          "## Variants",
          "direction: vertical, horizontal. Options with or without description.",
          "## States",
          "Default, disabled, error.",
          "## Behavior",
          "Controlled: value + onChange. Arrow keys between options.",
          "## Dos and Don'ts",
          "**Do:** 2–6 mutually exclusive options. **Don't:** Many options (use Select). Toggle (use Checkbox/Toggle).",
          "## Accessibility",
          "Native radio inputs, fieldset/legend. Arrow keys. Error and description linked.",
          "## Design tokens consumed",
          "Typography, spacing. States tokenized.",
          "## Related components",
          "Select, Checkbox, Toggle, Field.",
        ].join("\n\n"),
      },
      canvas: { sourceState: "shown" },
    },
    layout: "centered",
  },
  argTypes: {
    name: { description: "Form name.", table: { category: "Form" } },
    label: { description: "Fieldset legend.", table: { category: "Content" } },
    options: { control: false,  description: "{ value, label, description? }[].", table: { category: "Content" } },
    direction: { description: "Layout.", control: "select", options: ["vertical", "horizontal"], table: { category: "Appearance" } },
    error: { description: "Error message.", table: { category: "State" } },
    disabled: { description: "Disable all options.", table: { category: "State" } },
  },
};

export default meta;

type Story = StoryObj<typeof RadioGroup>;

const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C", description: "Optional description text." },
] as const;

export const Default: Story = {
  tags: ["smoke"],
  render: () => (
    <StatefulRadioGroup name="radio-overview" label="Choose one" options={[...options]} initialValue="a" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const optionB = canvas.getByRole("radio", { name: /option b/i });
    await userEvent.click(optionB);
    await expect(optionB).toBeChecked();
  },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Controlled single-choice group.",
          "**When you'd use this:** Settings, filters. **Key props in use:** name, label, options, value, onChange. **What to watch:** Controlled state. **Real product example:** Region, density.",
        ].join("\n\n"),
      },
    },
  },
};

export const Playground: Story = {
  render: () => (
    <StatefulRadioGroup name="radio-play" label="Choose one" options={[...options]} initialValue="a" />
  ),
  parameters: {
    docs: {
      description: {
        story: "**What this story shows:** Interactive playground for RadioGroup. **When you'd use this:** Exploration only — not canonical UX. **Key props in use:** name, label, options. **What to watch:** N/A. **Real product example:** N/A.",
      },
    },
    padding: 32,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <StatefulRadioGroup name="radio-vert" label="Vertical" options={[...options]} initialValue="b" />
      <StatefulRadioGroup name="radio-horz" label="Horizontal" direction="horizontal" options={[...options]} initialValue="b" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Vertical and horizontal.",
          "**When you'd use this:** Layout choice. **Key props in use:** direction. **What to watch:** Alignment. **Real product example:** Filter bar vs form.",
        ].join("\n\n"),
      },
    },
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="sb-stack">
      <StatefulRadioGroup name="radio-default" label="Default" options={[...options]} initialValue="a" />
      <StatefulRadioGroup name="radio-error" label="With error" options={[...options]} error="Please select one" initialValue="a" />
      <StatefulRadioGroup name="radio-disabled" label="Disabled" options={[...options]} disabled initialValue="a" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Default, error, disabled.",
          "**When you'd use this:** Validation/read-only. **Key props in use:** error, disabled. **What to watch:** Error message. **Real product example:** Required field, disabled options.",
        ].join("\n\n"),
      },
    },
  },
};

export const InContext: Story = {
  render: () => (
    <StatefulRadioGroup
      name="radio-long"
      label="Long label that should wrap gracefully on narrow screens"
      options={[
        { value: "a", label: "Long option label that may wrap and still align correctly" },
        { value: "b", label: "Second option" },
      ]}
      initialValue="a"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long labels wrap.",
          "**When you'd use this:** Verbose options. **Key props in use:** label, options. **What to watch:** Wrap. **Real product example:** Policy options.",
        ].join("\n\n"),
      },
    },
  },
};

export const DarkModeVariant: Story = {
  parameters: {
    themes: { themeOverride: "dark" },
    docs: {
      description: {
        story: [
          "**What this story shows:** RadioGroup in dark theme.",
          "**When you'd use this:** Dark UI. **Key props in use:** theme. **What to watch:** Contrast. **Real product example:** Operator dark mode.",
        ].join("\n\n"),
      },
    },
  },
  render: () => (
    <StatefulRadioGroup name="radio-dark" label="Choose one" options={[...options]} initialValue="a" />
  ),
};

export const EdgeCases: Story = {
  render: () => (
    <StatefulRadioGroup
      name="radio-long"
      label="Long label that should wrap gracefully on narrow screens"
      options={[
        { value: "a", label: "Long option label that may wrap and still align correctly" },
        { value: "b", label: "Second option" },
      ]}
      initialValue="a"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long labels wrap stress.",
          "**When you'd use this:** Edge copy. **Key props in use:** label, options. **What to watch:** No overflow. **Real product example:** N/A.",
        ].join("\n\n"),
      },
    },
  },
};

export const Accessibility: Story = {
  render: () => (
    <StatefulRadioGroup
      name="radio-a11y"
      label="Focus with Tab"
      description="Use arrow keys to move between options."
      options={[...options]}
      initialValue="b"
    />
  ),
  parameters: {
    a11y: { element: "#storybook-root" },
    docs: {
      description: {
        story: [
          "**What this story shows:** fieldset/legend, arrow keys, description.",
          "**When you'd use this:** A11y audit. **Key props in use:** label, description. **What to watch:** Keyboard nav. **Real product example:** Any radio group.",
        ].join("\n\n"),
      },
    },
  },
};

