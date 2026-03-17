import type { Meta, StoryObj } from "@storybook/react";
import { Display, H1, H2, H3, Body, Caption } from "@/design-system/components/typography";
import { Stack } from "@/design-system/core/primitives";

const meta = {
  title: "Foundations/Typography",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Typography scale. Use Display/H1/H2/H3/Body/Caption or --typo-* tokens.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Scale: Story = {
  render: () => (
    <Stack gap="4">
      <Display>Display</Display>
      <H1>Heading 1</H1>
      <H2>Heading 2</H2>
      <H3>Heading 3</H3>
      <Body>Body text</Body>
      <Caption>Caption text</Caption>
    </Stack>
  ),
};
