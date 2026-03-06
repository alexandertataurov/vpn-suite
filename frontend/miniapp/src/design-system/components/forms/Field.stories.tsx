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
    label: "Field label",
    children: <input type="text" placeholder="Control" className="input" />,
  },
};

export const FieldVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <Field label="Default">
        <input type="text" placeholder="Control" className="input" />
      </Field>
      <Field label="With description" description="Optional hint text">
        <input type="text" placeholder="Control" className="input" />
      </Field>
    </div>
  ),
};

export const FieldSizes: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="m-0">Size variants are not exposed; spacing is tokenized.</p>
      <Field label="Field label">
        <input type="text" placeholder="Control" className="input" />
      </Field>
    </div>
  ),
};

export const FieldStates: Story = {
  render: () => (
    <div className="sb-stack">
      <Field label="Default">
        <input type="text" placeholder="Control" className="input" />
      </Field>
      <Field label="With description" description="Optional hint text">
        <input type="text" placeholder="Control" className="input" />
      </Field>
      <Field label="With error" error="This field is required">
        <input type="text" placeholder="Control" className="input input-error" />
      </Field>
    </div>
  ),
};

export const FieldWithLongText: Story = {
  render: () => (
    <Field label="Long label for a control that should wrap and remain readable" description="Long description that should wrap across lines without breaking layout">
      <input type="text" placeholder="Control" className="input" />
    </Field>
  ),
};

export const FieldAccessibility: Story = {
  args: {
    label: "Field label",
    description: "Help text",
    error: "Error message",
    children: <input type="text" placeholder="Control" className="input input-error" />,
  },
};

export const FieldDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: {
    label: "Field label",
    children: <input type="text" placeholder="Control" className="input" />,
  },
};

export const FieldEdgeCases = FieldWithLongText;
