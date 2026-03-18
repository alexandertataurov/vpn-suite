import type { Meta, StoryObj } from "@storybook/react";
import { Text, Stack } from "../index";

const meta: Meta<typeof Text> = {
  title: "Primitives/Text",
  component: Text,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Semantic text variants. Use body, body-sm, meta, caption for hierarchy.",
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
    <Stack gap="4">
      <div>
        <Text variant="body">Body — primary reading text</Text>
      </div>
      <div>
        <Text variant="body-sm">Body small — secondary or compact</Text>
      </div>
      <div>
        <Text variant="meta">Meta — labels, uppercase</Text>
      </div>
      <div>
        <Text variant="caption">Caption — hints, tertiary</Text>
      </div>
    </Stack>
  ),
};

export const AsElement: Story = {
  render: () => (
    <Stack gap="2">
      <Text as="p">As paragraph</Text>
      <Text as="span">As span (inline)</Text>
      <Text as="code">As code</Text>
    </Stack>
  ),
};
