import type { Meta, StoryObj } from "@storybook/react";
import { Field } from "@/design-system";

const meta: Meta<typeof Field> = {
  title: "UI/Components/Inputs/Field",
  component: Field,
  tags: ["smoke"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "Form field wrapper: label, optional description, optional error. Use around Input, Select, Checkbox. Tokenized spacing.",
          "## When to use",
          "Wrap a single form control with label, description, and/or error.",
          "## When NOT to use",
          "Without a control. Wrapping multiple controls (one Field per control).",
          "## Anatomy",
          "Label, optional description, control slot (children), optional error message.",
          "## Variants",
          "Default; with description; with error.",
          "## States",
          "Default, error (shows message and can style control).",
          "## Behavior",
          "Layout only. Error/description drive aria-describedby when control supports it.",
          "## Dos and Don'ts",
          "**Do:** Wrap single control. **Don't:** Use without control; wrap multiple controls.",
          "## Accessibility",
          "Label; aria-describedby for description and error.",
          "## Design tokens consumed",
          "Spacing, typography, color.",
          "## Related components",
          "Label, Input, Select, Checkbox, HelperText, InlineError.",
        ].join("\n\n"),
      },
      canvas: { sourceState: "shown" },
    },
    layout: "centered",
  },
  argTypes: {
    label: { control: "text", table: { category: "Content" } },
    description: { control: "text", table: { category: "Content" } },
    error: { control: "text", table: { category: "State" } },
    children: { control: false, table: { category: "Content" } },
  },
};

export default meta;

type Story = StoryObj<typeof Field>;

export const Default: Story = {
  args: {
    label: "Field label",
    children: <input type="text" placeholder="Control" className="input" />,
  },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Field with label and control.",
          "**When you'd use this:** Any form control. **Key props in use:** label, children. **What to watch:** Structure. **Real product example:** Server name, region.",
        ].join("\n\n"),
      },
    },
  },
};

export const Playground: Story = {
  args: {
    label: "Field label",
    children: <input type="text" placeholder="Control" className="input" />,
  },
  parameters: {
    docs: {
      description: {
        story: "**What this story shows:** Interactive playground for Field. **When you'd use this:** Exploration only — not canonical UX. **Key props in use:** label, description, error, children. **What to watch:** N/A. **Real product example:** N/A.",
      },
    },
    padding: 32,
  },
};

export const AllVariants: Story = {
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
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Default and with description.",
          "**When you'd use this:** Choosing hint. **Key props in use:** description. **What to watch:** Spacing. **Real product example:** Optional hint.",
        ].join("\n\n"),
      },
    },
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="sb-stack">
      <Field label="Default">
        <input type="text" placeholder="Control" className="input" />
      </Field>
      <Field label="With error" error="This field is required">
        <input type="text" placeholder="Control" className="input input-error" />
      </Field>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Default and error state.",
          "**When you'd use this:** Validation. **Key props in use:** error. **What to watch:** Error message visibility. **Real product example:** Required field.",
        ].join("\n\n"),
      },
    },
  },
};

export const InContext: Story = {
  render: () => (
    <Field label="Long label for a control that should wrap and remain readable" description="Long description that should wrap across lines without breaking layout">
      <input type="text" placeholder="Control" className="input" />
    </Field>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long label and description wrap.",
          "**When you'd use this:** Verbose fields. **Key props in use:** label, description. **What to watch:** Readability. **Real product example:** Config description.",
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
          "**What this story shows:** Field in dark theme.",
          "**When you'd use this:** Dark UI. **Key props in use:** theme. **What to watch:** Contrast. **Real product example:** Operator dark mode.",
        ].join("\n\n"),
      },
    },
  },
  args: {
    label: "Field label",
    children: <input type="text" placeholder="Control" className="input" />,
  },
};

export const EdgeCases: Story = {
  render: () => (
    <Field label="Long label for a control that should wrap and remain readable" description="Long description that should wrap across lines without breaking layout">
      <input type="text" placeholder="Control" className="input" />
    </Field>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long content wrap stress.",
          "**When you'd use this:** Edge copy. **Key props in use:** label, description. **What to watch:** No overflow. **Real product example:** N/A.",
        ].join("\n\n"),
      },
    },
  },
};

export const Accessibility: Story = {
  args: {
    label: "Field label",
    description: "Help text",
    error: "Error message",
    children: <input type="text" placeholder="Control" className="input input-error" />,
  },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Label and aria-describedby for description/error.",
          "**When you'd use this:** A11y audit. **Key props in use:** label, description, error. **What to watch:** Screen reader. **Real product example:** Any field.",
        ].join("\n\n"),
      },
    },
  },
};
