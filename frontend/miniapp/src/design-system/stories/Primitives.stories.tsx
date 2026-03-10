import type { Meta, StoryObj } from "@storybook/react";
import { Box, Container, Divider, Heading, Inline, Panel, Stack, Text } from "../primitives";

const meta = {
  title: "Design System/Primitives",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Layout and typography primitives. Use tokens via className; no business logic.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const BoxDemo: Story = {
  render: () => (
    <Box className="p-4" style={{ background: "var(--color-surface-2)", borderRadius: "var(--radius-md)" }}>
      Box with padding and background
    </Box>
  ),
};

export const StackDemo: Story = {
  render: () => (
    <Stack gap="4" className="max-w-xs">
      <Text>First</Text>
      <Text>Second</Text>
      <Text>Third</Text>
    </Stack>
  ),
};

export const InlineDemo: Story = {
  render: () => (
    <Inline gap="2" wrap>
      <span className="chip cn">Chip 1</span>
      <span className="chip cb">Chip 2</span>
      <span className="chip cg">Chip 3</span>
    </Inline>
  ),
};

export const ContainerDemo: Story = {
  render: () => (
    <Container className="p-4" style={{ background: "var(--color-surface-2)" }}>
      Container (max-width + padding)
    </Container>
  ),
};

export const PanelDemo: Story = {
  render: () => (
    <Panel className="p-4">
      Panel with border and background
    </Panel>
  ),
};

export const DividerDemo: Story = {
  render: () => (
    <Stack gap="2">
      <Text>Above</Text>
      <Divider />
      <Text>Below</Text>
    </Stack>
  ),
};

export const TextVariants: Story = {
  render: () => (
    <Stack gap="2">
      <Text variant="body">Body text</Text>
      <Text variant="body-sm">Body small</Text>
      <Text variant="meta">Meta</Text>
      <Text variant="caption">Caption</Text>
    </Stack>
  ),
};

export const HeadingLevels: Story = {
  render: () => (
    <Stack gap="2">
      <Heading level={1}>Heading 1</Heading>
      <Heading level={2}>Heading 2</Heading>
      <Heading level={3}>Heading 3</Heading>
    </Stack>
  ),
};
