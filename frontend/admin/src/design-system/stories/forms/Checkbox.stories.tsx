import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Button, Checkbox } from "@/design-system";
import { renderDarkLight, renderAtBreakpoints } from "../../../../.storybook/utils/storyRenderers";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Components/Inputs/Checkbox",
  component: Checkbox,
  tags: ["a11y", "interaction"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "Checkbox is a boolean form control with an associated label. Use for options (enable feature, accept terms) and small multi-select sets. Native input with styled presentation.",
          "## When to use",
          "Boolean options, small multi-select. Accept terms, enable feature.",
          "## When NOT to use",
          "Single exclusive choice (use RadioGroup). Long option lists (use Select).",
          "## Anatomy",
          "- **Container** — Wrapper for input + label. **Label** — Associated text. **State layer** — Checked, indeterminate, disabled from tokens.",
          "## Variants",
          "Single variant; checked, unchecked, indeterminate, disabled are states.",
          "## States",
          "- **Unchecked** — Default. **Checked** — defaultChecked or controlled. **Indeterminate** — Partial selection. **Disabled** — Non-interactive.",
          "## Behavior",
          "Click or Space toggles. Tab to focus. Label click activates. Screen reader announces state.",
          "## Dos and Don'ts",
          "**Do:** Use for booleans and small multi-select. **Don't:** Single exclusive choice (use RadioGroup). Long lists (use Select).",
          "## Accessibility",
          "Label associated with input. Tab to focus. State announced.",
          "## Design tokens consumed",
          "Size, border, background, check color. Dark mode inverts.",
          "## Related components",
          "RadioGroup, Select, Field.",
        ].join("\n\n"),
      },
      canvas: { sourceState: "shown" },
    },
    layout: "centered",
  },
  argTypes: {
    label: {
      description: "Label text (associated with input).",
      control: false,
      table: { type: { summary: "ReactNode" }, category: "Content" },
    },
    defaultChecked: {
      description: "Initial checked state (uncontrolled).",
      control: "boolean",
      table: { category: "Behavior" },
    },
    disabled: {
      description: "Disables the checkbox.",
      control: "boolean",
      table: { category: "Behavior" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  tags: ["smoke"],
  args: { label: "Accept terms and conditions" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: /accept terms and conditions/i });
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
  },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Checkbox with a typical terms label.",
          "**When you'd use this:** Sign-up, settings, boolean options. **Key props in use:** `label`. **What to watch:** Label must be descriptive. **Real product example:** Operator settings, accept terms.",
        ].join("\n\n"),
      },
    },
  },
};

export const Playground: Story = {
  args: { label: "Option", defaultChecked: false, disabled: false },
  parameters: {
    docs: {
      description: {
        story: "**What this story shows:** Interactive playground for Checkbox. **When you'd use this:** Exploration only — not canonical UX. **Key props in use:** label, defaultChecked, disabled. **What to watch:** N/A. **Real product example:** N/A.",
      },
    },
    padding: 32,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="sb-stack">
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Disabled" disabled />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Unchecked, checked, and disabled states.",
          "**When you'd use this:** State reference. **Key props in use:** defaultChecked, disabled. **What to watch:** Disabled must be visually distinct. **Real product example:** Form options.",
        ].join("\n\n"),
      },
    },
  },
};

export const InContext: Story = {
  render: () => (
    <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 360 }}>
      <Checkbox label="Enable telemetry collection" defaultChecked />
      <Checkbox label="Include debug logs in exports" />
      <div className="sb-row">
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Save</Button>
      </div>
    </form>
  ),
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Checkboxes in a settings form with save/cancel.",
          "**When you'd use this:** Config or preferences. **Key props in use:** label, defaultChecked. **What to watch:** One primary action. **Real product example:** Telemetry or export settings.",
        ].join("\n\n"),
      },
    },
  },
};

export const DarkModeVariant: Story = {
  render: () => renderDarkLight(() => <Checkbox label="Accept terms" />) as React.ReactElement,
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Checkbox in light and dark theme.",
          "**When you'd use this:** Theme review. **Key props in use:** theme. **What to watch:** Contrast. **Real product example:** Operator dark UI.",
        ].join("\n\n"),
      },
    },
  },
};

export const ResponsiveLayout: Story = {
  render: () => renderAtBreakpoints(() => <Checkbox label="Option" />) as React.ReactElement,
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Checkbox at breakpoints.",
          "**When you'd use this:** Mobile forms. **Key props in use:** viewport. **What to watch:** Touch target. **Real product example:** Mobile settings.",
        ].join("\n\n"),
      },
    },
  },
};

export const EdgeCases: Story = {
  args: { label: "I agree to the terms and confirm I understand the data retention policy" },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Long label wrapping.",
          "**When you'd use this:** Dense legal or policy copy. **Key props in use:** long label. **What to watch:** Wrap, no truncation. **Real product example:** Terms or policy checkboxes.",
        ].join("\n\n"),
      },
    },
  },
};

export const Accessibility: Story = {
  args: { label: "Focus me with Tab" },
  parameters: {
    a11y: { element: "#storybook-root" },
    docs: {
      description: {
        story: [
          "**What this story shows:** Tab focus and label announcement.",
          "**When you'd use this:** A11y audit. **Key props in use:** label. **What to watch:** Label read on focus. **Real product example:** Any checkbox.",
        ].join("\n\n"),
      },
    },
  },
};
