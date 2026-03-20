import type { Meta, StoryObj } from "@storybook/react";
import { Divider, Stack } from "./index";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof Divider> = {
  title: "Primitives/Divider",
  component: Divider,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Horizontal and vertical separators for section breaks, list dividers, and spacing rhythm. Prefer `Divider` over custom borders.",
      },
    },
  },
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] },
    tone: { control: "select", options: ["subtle", "default"] },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    orientation: "horizontal",
    tone: "subtle",
  },
};

export const Orientations: Story = {
  render: () => (
    <StorySection title="Orientations" description="Horizontal separators split content; vertical separators keep dense rows legible.">
      <StoryShowcase>
        <Stack gap="6">
          <DividerExample orientation="horizontal" />
          <DividerExample orientation="vertical" />
        </Stack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Tones: Story = {
  render: () => (
    <StorySection title="Tones" description="Subtle dividers for nested structure; default dividers for stronger separation.">
      <StoryShowcase>
        <Stack gap="4">
          <Stack gap="2">
            <ExampleLabel>tone=subtle</ExampleLabel>
            <Divider orientation="horizontal" tone="subtle" />
          </Stack>
          <Stack gap="2">
            <ExampleLabel>tone=default</ExampleLabel>
            <Divider orientation="horizontal" tone="default" />
          </Stack>
        </Stack>
      </StoryShowcase>
    </StorySection>
  ),
};

function DividerExample({
  orientation,
}: {
  orientation: "horizontal" | "vertical";
}) {
  return orientation === "horizontal" ? (
    <Stack gap="2">
      <ExampleLabel>orientation=horizontal</ExampleLabel>
      <Stack gap="2">
        <span>Section A</span>
        <Divider orientation="horizontal" tone="subtle" />
        <span>Section B</span>
      </Stack>
    </Stack>
  ) : (
    <Stack gap="2" direction="horizontal" align="stretch">
      <ExampleLabel>orientation=vertical</ExampleLabel>
      <Divider orientation="vertical" tone="subtle" />
      <span>Center</span>
      <Divider orientation="vertical" tone="default" />
      <span>Right</span>
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
