import type { Meta, StoryObj } from "@storybook/react";
import { Field } from "./Field";

const meta: Meta<typeof Field> = {
  title: "Shared/Primitives/Field",
  component: Field,
  parameters: {
    docs: {
      description: {
        component: `Form field wrapper: label, description, error.

**Purpose:** Wrap Input, Select, Checkbox. Don't use without control.

**States:** Default, error (shows message).

**Accessibility:** Label association, aria-describedby for error. **Do:** Always use label. **Don't:** Wrap multiple controls.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Field>;

export const FieldOverview: Story = {
  args: {
    id: "field-control",
    label: "Field label",
    children: <input id="field-control" type="text" placeholder="Control" className="input" aria-label="Field label" />,
  },
};

export const FieldVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <Field id="field-default" label="Default">
        <input id="field-default" type="text" placeholder="Control" className="input" aria-label="Default" />
      </Field>
      <Field id="field-desc" label="With description" description="Optional hint text">
        <input id="field-desc" type="text" placeholder="Control" className="input" aria-label="With description" />
      </Field>
    </div>
  ),
};

export const FieldSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; spacing is tokenized.</p>
      <Field id="field-size" label="Field label">
        <input id="field-size" type="text" placeholder="Control" className="input" aria-label="Field label" />
      </Field>
    </div>
  ),
};

export const FieldStates: Story = {
  render: () => (
    <div className="sb-stack">
      <Field id="field-state-default" label="Default">
        <input id="field-state-default" type="text" placeholder="Control" className="input" aria-label="Default" />
      </Field>
      <Field id="field-state-desc" label="With description" description="Optional hint text">
        <input id="field-state-desc" type="text" placeholder="Control" className="input" aria-label="With description" />
      </Field>
      <Field id="field-state-error" label="With error" error="This field is required">
        <input id="field-state-error" type="text" placeholder="Control" className="input input-error" aria-label="With error" />
      </Field>
    </div>
  ),
};

export const FieldWithLongText: Story = {
  render: () => (
    <Field id="field-long" label="Long label for a control that should wrap and remain readable" description="Long description that should wrap across lines without breaking layout">
      <input id="field-long" type="text" placeholder="Control" className="input" aria-label="Long label for a control that should wrap" />
    </Field>
  ),
};

export const FieldAccessibility: Story = {
  args: {
    id: "field-a11y",
    label: "Field label",
    description: "Help text",
    error: "Error message",
    children: <input id="field-a11y" type="text" placeholder="Control" className="input input-error" aria-label="Field label" />,
  },
};

export const FieldDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: {
    id: "field-dark",
    label: "Field label",
    children: <input id="field-dark" type="text" placeholder="Control" className="input" aria-label="Field label" />,
  },
};

export const FieldEdgeCases = FieldWithLongText;
