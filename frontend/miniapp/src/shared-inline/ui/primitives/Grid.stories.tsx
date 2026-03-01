import type { Meta, StoryObj } from "@storybook/react";
import { Grid } from "./Grid";
import { StoryStack, StoryPanel } from "../../storybook/wrappers";
import { storyText } from "../../storybook/fixtures";

const meta: Meta<typeof Grid> = {
  title: "Primitives/Grid",
  component: Grid,
  argTypes: {
    columns: { control: "select", options: ["1", "2", "3", "4", "auto"] },
    gap: { control: "select", options: ["1", "2", "3", "4", "6", "8", "10"] },
    minWidth: { control: "select", options: ["col", "col-sm", "card", "card-lg"] },
  },
};

export default meta;

type Story = StoryObj<typeof Grid>;

const gridItems = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"];

export const Overview: Story = {
  render: () => (
    <Grid columns="3" gap="4">
      {gridItems.map((item) => (
        <StoryPanel key={item}>{item}</StoryPanel>
      ))}
    </Grid>
  ),
};

export const Variants: Story = {
  render: () => (
    <StoryStack>
      <Grid columns="2" minWidth="card" gap="4">
        {gridItems.slice(0, 4).map((item) => (
          <StoryPanel key={item}>{item}</StoryPanel>
        ))}
      </Grid>
      <Grid columns="auto" minWidth="col-sm" gap="3">
        {gridItems.map((item) => (
          <StoryPanel key={item}>{item}</StoryPanel>
        ))}
      </Grid>
    </StoryStack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <StoryStack>
      <Grid columns="2" minWidth="col" gap="2">
        {gridItems.slice(0, 4).map((item) => (
          <StoryPanel key={item}>{item}</StoryPanel>
        ))}
      </Grid>
      <Grid columns="2" minWidth="card-lg" gap="6">
        {gridItems.slice(0, 4).map((item) => (
          <StoryPanel key={item}>{item}</StoryPanel>
        ))}
      </Grid>
    </StoryStack>
  ),
};

export const States: Story = {
  render: () => (
    <Grid columns="3" gap="4">
      <StoryPanel>Default</StoryPanel>
      <StoryPanel>Hover (visual)</StoryPanel>
      <StoryPanel>Active (visual)</StoryPanel>
    </Grid>
  ),
};

export const EdgeCases: Story = {
  render: () => (
    <Grid columns="2" gap="3">
      <StoryPanel>{storyText.veryLong}</StoryPanel>
      <StoryPanel>—</StoryPanel>
      <StoryPanel>0</StoryPanel>
      <StoryPanel>{storyText.longLabel}</StoryPanel>
    </Grid>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <Grid columns="3" gap="4">
      {gridItems.slice(0, 3).map((item) => (
        <StoryPanel key={item}>{item}</StoryPanel>
      ))}
    </Grid>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <Grid columns="2" gap="3" aria-label="Grid demo">
      <StoryPanel>Focusable content</StoryPanel>
      <StoryPanel>Use meaningful content order</StoryPanel>
    </Grid>
  ),
};
