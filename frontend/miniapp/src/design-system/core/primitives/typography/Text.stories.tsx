import type { Meta, StoryObj } from "@storybook/react";
import { Text, Stack } from "../index";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof Text> = {
  title: "Primitives/Text",
  component: Text,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Semantic text variants for body copy, compact text, metadata, and captions. Use the variant that matches the information hierarchy.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["body", "body-sm", "meta", "caption"] },
    as: { control: "select", options: ["p", "span", "div", "code"] },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Body text — default variant",
    variant: "body",
  },
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Body, body-sm, meta, and caption are the only supported text tiers.">
      <StoryShowcase>
        <Stack gap="4">
          <Text variant="body">Body - primary reading text</Text>
          <Text variant="body-sm">Body small - secondary or compact</Text>
          <Text variant="meta">Meta - labels, uppercase</Text>
          <Text variant="caption">Caption - hints, tertiary</Text>
        </Stack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const AsElement: Story = {
  render: () => (
    <StorySection title="As element" description="Choose the semantic element without changing the visual variant.">
      <StoryShowcase>
        <Stack gap="2">
          <Text as="p">As paragraph</Text>
          <Text as="span">As span (inline)</Text>
          <Text as="code">As code</Text>
        </Stack>
      </StoryShowcase>
    </StorySection>
  ),
};
