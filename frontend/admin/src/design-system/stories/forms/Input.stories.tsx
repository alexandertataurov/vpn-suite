import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
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
          "Input is the single-line text primitive for form fields and search. It supports label, helper text, error state, and optional prefix/suffix. Use inside Field when you need consistent label and error wiring.",
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(/email/i);
    await userEvent.type(input, "user@example.com");
    await expect(input).toHaveValue("user@example.com");
  },
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Labeled email input with placeholder.",
          "**When you'd use this:** Login, settings, any single-line email field.",
          "**Key props in use:** `label`, `placeholder`. **What to watch:** Always pair with label or aria-label. **Real product example:** Operator login or account email field.",
        ].join("\n\n"),
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
        story: [
          "**What this story shows:** Text, email, and password types for semantic behavior.",
          "**When you'd use this:** Choosing input type for forms. **Key props in use:** `type`. **What to watch:** Use type=email for email. **Real product example:** Login or device config form.",
        ].join("\n\n"),
      },
    },
  },
};

export const Playground: Story = {
  args: { label: "Label", placeholder: "Enter text", error: "", disabled: false },
  parameters: {
    docs: {
      description: {
        story: "**What this story shows:** Interactive playground for Input. **When you'd use this:** Exploration only — not canonical UX. **Key props in use:** label, placeholder, error, disabled. **What to watch:** N/A. **Real product example:** N/A.",
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
        story: [
          "**What this story shows:** Default, error, and disabled states side by side.",
          "**When you'd use this:** Validating form state UX. **Key props in use:** `error`, `disabled`. **What to watch:** Error must show a message. **Real product example:** Server name validation.",
        ].join("\n\n"),
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
        story: [
          "**What this story shows:** Input inside a form with description and save/cancel actions.",
          "**When you'd use this:** Server or device config forms. **Key props in use:** `label`, `description`. **What to watch:** One primary action. **Real product example:** Add server or edit device form.",
        ].join("\n\n"),
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
        story: [
          "**What this story shows:** Search input with prefix icon and port field with suffix unit.",
          "**When you'd use this:** Search bars, numeric fields with units. **Key props in use:** `prefix`, `suffix`. **What to watch:** Prefix/suffix are decorative; label is required. **Real product example:** Fleet search, WireGuard port field.",
        ].join("\n\n"),
      },
    },
  },
};

export const DarkModeVariant: Story = {
  render: () => renderDarkLight(() => <Input label="Email" placeholder="you@example.com" />) as React.ReactElement,
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Input in light and dark theme.",
          "**When you'd use this:** Theme review. **Key props in use:** theme. **What to watch:** Contrast. **Real product example:** Operator dark UI.",
        ].join("\n\n"),
      },
    },
  },
};

export const ResponsiveLayout: Story = {
  render: () => renderAtBreakpoints(() => <Input label="Search" placeholder="Search..." />) as React.ReactElement,
  parameters: {
    docs: {
      description: {
        story: [
          "**What this story shows:** Input at multiple breakpoints.",
          "**When you'd use this:** Mobile/tablet forms. **Key props in use:** viewport. **What to watch:** Touch target and wrap. **Real product example:** Mobile fleet search.",
        ].join("\n\n"),
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
        story: [
          "**What this story shows:** Long label wrap, error message, disabled with value.",
          "**When you'd use this:** Edge case review. **Key props in use:** `error`, `disabled`. **What to watch:** Label wraps; error is visible. **Real product example:** Validation and disabled states.",
        ].join("\n\n"),
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
