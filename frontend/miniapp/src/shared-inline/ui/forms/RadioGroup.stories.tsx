import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup } from "./RadioGroup";

function StatefulRadioGroup(props: Omit<Parameters<typeof RadioGroup>[0], "value" | "onChange"> & { initialValue?: string }) {
  const [value, setValue] = useState(props.initialValue ?? "");
  return <RadioGroup {...props} value={value} onChange={setValue} />;
}

const meta: Meta<typeof RadioGroup> = {
  title: "Shared/Primitives/RadioGroup",
  component: RadioGroup,
  parameters: {
    docs: {
      description: {
        component: `Single-choice selection with explicit options.

**Purpose:** Choose exactly one option from a small set (2–6).

**States:** Default, disabled, error. **Accessibility:** Uses native radio inputs with fieldset/legend.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RadioGroup>;

const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C", description: "Optional description text." },
] as const;

export const RadioGroupOverview: Story = {
  render: () => {
    return (
      <StatefulRadioGroup
        name="radio-overview"
        label="Choose one"
        options={[...options]}
        initialValue="a"
      />
    );
  },
};

export const RadioGroupVariants: Story = {
  render: () => {
    return (
      <div className="sb-stack">
        <StatefulRadioGroup
          name="radio-vert"
          label="Vertical"
          options={[...options]}
          initialValue="b"
        />
        <StatefulRadioGroup
          name="radio-horz"
          label="Horizontal"
          direction="horizontal"
          options={[...options]}
          initialValue="b"
        />
      </div>
    );
  },
};

export const RadioGroupSizes: Story = {
  render: () => <p className="m-0">Size variants are not exposed; radios use tokenized sizing.</p>,
};

export const RadioGroupStates: Story = {
  render: () => {
    return (
      <div className="sb-stack">
        <StatefulRadioGroup
          name="radio-default"
          label="Default"
          options={[...options]}
          initialValue="a"
        />
        <StatefulRadioGroup
          name="radio-error"
          label="With error"
          options={[...options]}
          error="Please select one"
          initialValue="a"
        />
        <StatefulRadioGroup
          name="radio-disabled"
          label="Disabled"
          options={[...options]}
          disabled
          initialValue="a"
        />
      </div>
    );
  },
};

export const RadioGroupWithLongText: Story = {
  render: () => {
    return (
      <StatefulRadioGroup
        name="radio-long"
        label="Long label that should wrap gracefully on narrow screens"
        options={[
          { value: "a", label: "Long option label that may wrap and still align correctly" },
          { value: "b", label: "Second option" },
        ]}
        initialValue="a"
      />
    );
  },
};

export const RadioGroupAccessibility: Story = {
  render: () => {
    return (
      <StatefulRadioGroup
        name="radio-a11y"
        label="Focus with Tab"
        description="Use arrow keys to move between options."
        options={[...options]}
        initialValue="b"
      />
    );
  },
};

export const RadioGroupDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => {
    return (
      <StatefulRadioGroup
        name="radio-dark"
        label="Choose one"
        options={[...options]}
        initialValue="a"
      />
    );
  },
};

export const RadioGroupEdgeCases = WithLongText;

