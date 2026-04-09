import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./index";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof Stack> = {
  title: "Primitives/Stack",
  component: Stack,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Flex container for vertical and horizontal composition. Use `Stack` for gap, alignment, and spacing control instead of hand-rolled flex wrappers.",
      },
    },
  },
  argTypes: {
    direction: { control: "select", options: ["vertical", "horizontal"] },
    gap: { control: "select", options: ["1", "2", "3", "4", "6"] },
    align: { control: "select", options: ["start", "center", "end", "stretch"] },
    justify: { control: "select", options: ["start", "center", "end", "between"] },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <span>Item 1</span>
        <span>Item 2</span>
        <span>Item 3</span>
      </>
    ),
    direction: "vertical",
    gap: "4",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Default vertical stack for simple column layout with tokenized spacing.",
      },
    },
  },
};

export const Gaps: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Gap tokens compared side by side to show the spacing scale in a real row layout.",
      },
    },
  },
  render: () => (
    <StorySection title="Gaps" description="Gap tokens render consistently across layouts.">
      <StoryShowcase>
        <Stack gap="6">
          <StackExample label="gap=1 (4px)" gap="1" />
          <StackExample label="gap=4 (16px)" gap="4" />
        </Stack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Directions: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Vertical and horizontal Stack usage with the same API, showing how the primitive flips direction without changing semantics.",
      },
    },
  },
  render: () => (
    <StorySection title="Directions" description="Vertical and horizontal compositions use the same API.">
      <StoryShowcase>
        <Stack gap="6">
          <DirectionExample direction="vertical" />
          <DirectionExample direction="horizontal" />
        </Stack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const AlignJustify: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Alignment and justification example for keeping wrapper markup semantic while the layout stays flexible.",
      },
    },
  },
  render: () => (
    <StorySection title="Alignment" description="Use justify and align to keep wrappers semantic.">
      <StoryShowcase>
        <Stack gap="6">
          <Stack gap="2" direction="horizontal" justify="between">
            <ExampleLabel>justify=between</ExampleLabel>
            <Stack gap="2" direction="horizontal" justify="between">
              <Pill>A</Pill>
              <Pill>B</Pill>
            </Stack>
          </Stack>
        </Stack>
      </StoryShowcase>
    </StorySection>
  ),
};

function StackExample({ label, gap }: { label: string; gap: "1" | "4" }) {
  return (
    <div>
      <ExampleLabel>{label}</ExampleLabel>
      <Stack gap={gap} direction="horizontal">
        <Pill />
        <Pill />
        <Pill />
      </Stack>
    </div>
  );
}

function DirectionExample({ direction }: { direction: "vertical" | "horizontal" }) {
  return (
    <Stack gap="2" direction="vertical">
      <ExampleLabel>direction={direction}</ExampleLabel>
      <Stack gap="2" direction={direction}>
        <Pill>A</Pill>
        <Pill>B</Pill>
      </Stack>
    </Stack>
  );
}

function ExampleLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "var(--typo-caption-size)",
        color: "var(--color-text-muted)",
      }}
    >
      {children}
    </span>
  );
}

function Pill({ children = "" }: { children?: React.ReactNode }) {
  return (
    <div
      style={{
        width: 40,
        height: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-accent)",
        opacity: 0.5,
        borderRadius: "var(--radius-sm)",
        paddingInline: 8,
      }}
    >
      {children}
    </div>
  );
}
