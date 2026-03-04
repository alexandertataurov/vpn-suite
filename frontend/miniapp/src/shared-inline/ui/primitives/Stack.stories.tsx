import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./Stack";
import { StoryPanel, StoryStack } from "../../storybook/wrappers";
import { storyText } from "../../storybook/fixtures";

const meta: Meta<typeof Stack> = {
  title: "Shared/Primitives/Stack",
  component: Stack,
  argTypes: {
    direction: { control: "select", options: ["vertical", "horizontal"] },
    gap: { control: "select", options: ["1", "2", "3", "4", "6", "8", "10"] },
    align: { control: "select", options: ["start", "center", "end", "stretch"] },
    justify: { control: "select", options: ["start", "center", "end", "between"] },
    wrap: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof Stack>;

export const StackOverview: Story = {
  render: () => (
    <Stack gap="3">
      <StoryPanel>Alpha</StoryPanel>
      <StoryPanel>Beta</StoryPanel>
      <StoryPanel>Gamma</StoryPanel>
    </Stack>
  ),
};

export const StackVariants: Story = {
  render: () => (
    <StoryStack>
      <Stack direction="horizontal" gap="3" align="center">
        <StoryPanel>Horizontal</StoryPanel>
        <StoryPanel>Centered</StoryPanel>
      </Stack>
      <Stack direction="horizontal" gap="3" justify="between">
        <StoryPanel>Between</StoryPanel>
        <StoryPanel>Between</StoryPanel>
      </Stack>
    </StoryStack>
  ),
};

export const StackSizes: Story = {
  render: () => (
    <StoryStack>
      <Stack gap="1">
        <StoryPanel>Gap 1</StoryPanel>
        <StoryPanel>Gap 1</StoryPanel>
      </Stack>
      <Stack gap="6">
        <StoryPanel>Gap 6</StoryPanel>
        <StoryPanel>Gap 6</StoryPanel>
      </Stack>
    </StoryStack>
  ),
};

export const StackStates: Story = {
  render: () => (
    <Stack gap="3">
      <StoryPanel>Default</StoryPanel>
      <StoryPanel>Hover (visual)</StoryPanel>
      <StoryPanel>Active (visual)</StoryPanel>
    </Stack>
  ),
};

export const StackEdgeCases: Story = {
  render: () => (
    <Stack direction="horizontal" gap="2" wrap>
      <StoryPanel>{storyText.longLabel}</StoryPanel>
      <StoryPanel>{storyText.veryLong}</StoryPanel>
      <StoryPanel>0</StoryPanel>
    </Stack>
  ),
};

export const StackDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <Stack gap="3">
      <StoryPanel>Alpha</StoryPanel>
      <StoryPanel>Beta</StoryPanel>
    </Stack>
  ),
};

export const StackAccessibility: Story = {
  render: () => (
    <Stack gap="3" aria-label="Stack demo">
      <StoryPanel>Keyboard focus flows by DOM order</StoryPanel>
      <StoryPanel>Maintain semantic order</StoryPanel>
    </Stack>
  ),
};
