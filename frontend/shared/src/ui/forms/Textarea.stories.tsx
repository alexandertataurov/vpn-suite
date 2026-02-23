import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";
import { StoryStack, NarrowFrame } from "../../storybook/wrappers";
import { storyText } from "../../storybook/fixtures";

const meta: Meta<typeof Textarea> = {
  title: "Primitives/Textarea",
  component: Textarea,
  argTypes: {
    disabled: { control: "boolean" },
    rows: { control: "number" },
  },
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Overview: Story = {
  args: { label: "Notes", placeholder: "Enter notes" },
};

export const Variants: Story = {
  render: () => (
    <StoryStack>
      <Textarea label="Default" placeholder="Default" />
      <Textarea label="Error" placeholder="Error" error="Required" />
    </StoryStack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <StoryStack>
      <Textarea label="Rows 3" rows={3} placeholder="3 rows" />
      <Textarea label="Rows 6" rows={6} placeholder="6 rows" />
    </StoryStack>
  ),
};

export const States: Story = {
  render: () => (
    <StoryStack>
      <Textarea label="Default" placeholder="Default" />
      <Textarea label="Disabled" placeholder="Disabled" disabled />
      <Textarea label="Error" placeholder="Error" error="Validation failed" />
    </StoryStack>
  ),
};

export const EdgeCases: Story = {
  render: () => (
    <StoryStack>
      <Textarea label="Long label" placeholder={storyText.veryLong} rows={3} />
      <NarrowFrame>
        <Textarea label="Narrow" placeholder={storyText.longLabel} rows={3} />
      </NarrowFrame>
      <Textarea label="Empty" value="" rows={3} />
    </StoryStack>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { label: "Notes", placeholder: "Enter notes" },
};

export const Accessibility: Story = {
  args: { label: "Accessible notes", placeholder: "Tab to focus" },
};
