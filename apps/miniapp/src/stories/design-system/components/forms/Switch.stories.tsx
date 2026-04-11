import type { Meta, StoryObj } from "@storybook/react";
import { useArgs } from "storybook/preview-api";
import { Switch } from "@/design-system/components/forms/Switch";
import { StorySection, StoryShowcase } from "@/design-system";
import { Inline } from "@/design-system/primitives";

const meta = {
  title: "Components/Switch",
  tags: ["autodocs"],
  component: Switch,
  args: {
    checked: false,
    "aria-label": "Toggle setting",
  },
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Standalone switch control for boolean settings. Use `ToggleRow` when you need a settings-style label plus control row.",
      },
    },
  },
  argTypes: {
    checked: { control: "boolean", table: { category: "State" } },
    disabled: { control: "boolean", table: { category: "State" } },
    "aria-label": {
      table: { disable: true },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Baseline standalone switch for a boolean setting. Use the interactive story below when you want to review live state transitions.",
      },
    },
  },
  render: (args) => (
    <StorySection title="Default" description="Baseline standalone switch for boolean settings without a surrounding row.">
      <StoryShowcase>
        <Switch checked={args.checked} onCheckedChange={() => {}} aria-label={args["aria-label"] ?? "Toggle setting"} />
      </StoryShowcase>
    </StorySection>
  ),
};

export const States: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Off, on, and disabled states shown together for quick comparison.",
      },
    },
  },
  render: () => (
    <StorySection title="States" description="Off, on, and disabled states shown together for comparison.">
      <StoryShowcase>
        <div className="story-stack">
          <Inline gap="2" wrap align="center">
            <Switch checked={false} onCheckedChange={() => {}} aria-label="Off" />
            <span className="story-label">Off</span>
          </Inline>
          <Inline gap="2" wrap align="center">
            <Switch checked onCheckedChange={() => {}} aria-label="On" />
            <span className="story-label">On</span>
          </Inline>
          <Inline gap="2" wrap align="center">
            <Switch checked={false} onCheckedChange={() => {}} disabled aria-label="Disabled" />
            <span className="story-label">Disabled</span>
          </Inline>
        </div>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Simple interaction scenario for checking state transitions when the switch is used on its own rather than inside a labeled settings row.",
      },
    },
  },
  render: function InteractiveStory(args) {
    const [{ checked }, updateArgs] = useArgs();
    return (
      <StorySection title="Interactive" description="Toggle the switch to review motion and state transitions.">
        <StoryShowcase>
          <Switch
            checked={checked}
            onCheckedChange={(nextChecked) => updateArgs({ checked: nextChecked })}
            aria-label={args["aria-label"] ?? "Toggle"}
          />
        </StoryShowcase>
      </StorySection>
    );
  },
};
