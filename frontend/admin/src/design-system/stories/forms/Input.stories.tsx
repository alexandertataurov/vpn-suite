import type { Meta, StoryObj } from "@storybook/react";
import { Button, Input } from "@/design-system/primitives";
import { renderDarkLight, renderAtBreakpoints } from "../../../../.storybook/utils/storyRenderers";

const meta: Meta<typeof Input> = {
  title: "UI/Components/Inputs/Input",
  component: Input,
  tags: ["a11y", "interaction"],
  parameters: {
    docs: {
      description: {
        component: [
          "## Overview",
          "Input is the single-line text primitive for form fields and search. It supports label, helper text, error state, and optional prefix/suffix. Use it when a field needs clear affordance and consistent validation wiring.",
          "## When to use",
          "Single-line text: form fields, search. Always pair with label or aria-label.",
          "## When NOT to use",
          "Multi-line (use Textarea). Unlabeled fields.",
          "## Anatomy",
          "- **Container** — Wrapper that holds label, input, description, and error; spacing and border use layout tokens.",
          "- **Label** — Associated with the input via id; uses caption/label typography token.",
          "- **Leading element** — Optional prefix (e.g. search icon) before the input; does not replace label.",
          "- **Trailing element** — Optional suffix (e.g. unit, clear button) after the input.",
          "- **State layer** — Border and focus ring from tokens; error uses critical border and message below.",
          "## Variants",
          "No visual variants; use semantic types (text, email, password, search) and optional prefix/suffix for search or units.",
          "## States",
          "- **Default** — Resting border and placeholder. **Focus** — Focus ring. **Error** — Critical border + message. **Disabled** — Non-interactive, muted.",
          "## Behavior",
          "Mouse: click to focus. Keyboard: Tab in/out; type normally. Screen reader: label and error linked via aria-describedby.",
          "## Dos and Don'ts",
          "**Do:** Always provide label or aria-label. Use error string for validation. **Don't:** Use for multi-line (Textarea). Leave unlabeled.",
          "## Accessibility",
          "Label or aria-label required. Error and description in aria-describedby. Semantic type when applicable.",
          "## Design tokens consumed",
          "Border (default, focus, error), text, background. Spacing from layout.",
          "## Related components",
          "Field, Textarea, Select, Label.",
        ].join("\n\n"),
      },
      hero: { status: "stable", version: "1.0", category: "Primitives", importPath: "@/design-system" },
      propsTable: {
        rows: [
          { name: "label", type: "ReactNode", typeKind: "ReactNode", required: false, description: "Label for the input." },
          { name: "description", type: "ReactNode", typeKind: "ReactNode", required: false, description: "Helper text below label." },
          { name: "error", type: "boolean | string", typeKind: "string", required: false, description: "Error message; aria-describedby." },
          { name: "placeholder", type: "string", typeKind: "string", required: false, description: "Placeholder text." },
          { name: "disabled", type: "boolean", typeKind: "boolean", default: "false", required: false, description: "Disables the input." },
          { name: "prefix", type: "ReactNode", typeKind: "ReactNode", required: false, description: "Content before input." },
          { name: "suffix", type: "ReactNode", typeKind: "ReactNode", required: false, description: "Content after input." },
        ],
      },
      accessibility: {
        keyboardRows: [
          { key: "Tab", action: "Moves focus to next" },
          { key: "Shift+Tab", action: "Moves focus to previous" },
        ],
        ariaRoles: [{ role: "aria-describedby", description: "Error and description linked" }],
      },
      tokens: [
        { token: "--color-border-subtle", role: "border default", value: "#1C2A38", swatch: "#1C2A38" },
        { token: "--color-border-focus", role: "focus ring", value: "#0EA5E9", swatch: "#0EA5E9" },
        { token: "--color-critical-bright", role: "error state", value: "#EF4444", swatch: "#EF4444" },
      ],
      canvas: { sourceState: "shown" },
    },
    layout: "centered",
  },
  argTypes: {
    label: {
      description: "Label for the input. Used for id and accessibility.",
      control: false,
      table: { type: { summary: "ReactNode" }, category: "Content" },
    },
    description: {
      description: "Helper text below the label.",
      control: false,
      table: { type: { summary: "ReactNode" }, category: "Content" },
    },
    error: {
      description: "Error message (string) or boolean. String is shown and associated via aria-describedby.",
      control: "text",
      table: { type: { summary: "boolean | string" }, category: "Behavior" },
    },
    placeholder: {
      description: "Placeholder text.",
      control: "text",
      table: { type: { summary: "string" }, category: "Content" },
    },
    disabled: {
      description: "Disables the input.",
      control: "boolean",
      table: { type: { summary: "boolean" }, category: "Behavior" },
    },
    prefix: { description: "Content before the input.", control: false, table: { category: "Content" } },
    suffix: { description: "Content after the input.", control: false, table: { category: "Content" } },
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  tags: ["smoke"],
  args: { label: "Email", placeholder: "you@example.com" },
  parameters: {
    docs: {
      description: {
        story:
          "Labeled email field with placeholder text. Use this as the default contract for single-line inputs that need explicit labeling and a clear empty state.",
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="sb-stack">
      <Input label="Text" placeholder="Enter text" />
      <Input label="Email" type="email" placeholder="you@example.com" />
      <Input label="Password" type="password" placeholder="••••••••" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Text, email, and password types side by side. This is the quickest way to confirm the semantic input type before a form is wired up.",
      },
    },
  },
};

export const Playground: Story = {
  args: { label: "Label", placeholder: "Enter text", error: "", disabled: false },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive playground for shape and state exploration. Use it for local experimentation, not as the canonical form pattern.",
      },
    },
    padding: 32,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="sb-stack">
      <Input label="Default" placeholder="Enter text" />
      <Input label="With error" error="Invalid email" defaultValue="bad" />
      <Input label="Disabled" disabled defaultValue="Can't edit" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Default, error, and disabled states displayed together. Use this to validate the state ladder before it is reused in a form.",
      },
    },
  },
};

export const InContext: Story = {
  render: () => (
    <div className="sb-form-demo" role="form" aria-label="Server form">
      <Input label="Server name" placeholder="e.g. core-edge-01" description="Unique identifier for this node." />
      <div className="sb-row">
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Save</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Input inside a realistic form row with helper text and actions. This shows how the field should read when it is part of a complete screen.",
      },
    },
  },
};

export const WithPrefixSuffix: Story = {
  render: () => (
    <div className="sb-stack">
      <Input label="Search" placeholder="Search servers..." prefix={<span className="sb-input-prefix-icon" aria-hidden>🔍</span>} />
      <Input label="Port" type="number" placeholder="51820" suffix={<span className="sb-input-suffix-unit">UDP</span>} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Search and numeric variants with prefix and suffix affordances. Keep the adornments decorative and the label authoritative.",
      },
    },
  },
};

export const DarkModeVariant: Story = {
  render: () => renderDarkLight(() => <Input label="Email" placeholder="you@example.com" />) as React.ReactElement,
  parameters: {
    docs: {
      description: {
        story:
          "The same input rendered in light and dark themes. Use this to catch contrast or border issues across themes.",
      },
    },
  },
};

export const ResponsiveLayout: Story = {
  render: () => renderAtBreakpoints(() => <Input label="Search" placeholder="Search..." />) as React.ReactElement,
  parameters: {
    docs: {
      description: {
        story:
          "The input across breakpoint widths. This guards against label wrap, cramped spacing, and broken touch targets.",
      },
    },
  },
};

export const EdgeCases: Story = {
  render: () => (
    <div className="sb-stack">
      <Input label="Long label that should wrap gracefully on small screens" placeholder="Long placeholder content" />
      <Input label="Error" error="Invalid email address" defaultValue="invalid" />
      <Input label="Disabled" disabled defaultValue="user@example.com" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Edge cases for long labels, error copy, and disabled fields with values. Use it to verify the field does not collapse under real copy.",
      },
    },
  },
};

export const Accessibility: Story = {
  render: () => (
    <div className="sb-stack">
      <p className="sb-a11y-note">
        Tab to focus. Label associated; error in aria-describedby.
      </p>
      <Input label="Labeled input" placeholder="Tab to focus" />
      <Input label="With error" error="Required field" defaultValue="invalid" />
    </div>
  ),
  parameters: {
    a11y: { element: "#storybook-root" },
    docs: {
      description: {
        story: [
          "**What this story shows:** Label and error linked for screen readers.",
          "**When you'd use this:** A11y audit. **Key props in use:** `label`, `error`. **What to watch:** aria-describedby. **Real product example:** Any form with validation.",
        ].join("\n\n"),
      },
    },
  },
};
