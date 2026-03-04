import type { Meta, StoryObj } from "@storybook/react";
import { Container } from "./Container";
import { StoryStack } from "../../storybook/wrappers";
import { storyText } from "../../storybook/fixtures";

const meta: Meta<typeof Container> = {
  title: "Shared/Primitives/Container",
  component: Container,
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    padding: { control: "select", options: ["sm", "md"] },
  },
};

export default meta;

type Story = StoryObj<typeof Container>;

export const ContainerOverview: Story = {
  render: () => (
    <Container>
      <p className="m-0">Container wraps content with tokenized padding and max width.</p>
    </Container>
  ),
};

export const ContainerVariants: Story = {
  render: () => (
    <StoryStack>
      <Container size="sm" padding="sm">
        <p className="m-0">Small container</p>
      </Container>
      <Container size="lg" padding="md">
        <p className="m-0">Large container</p>
      </Container>
    </StoryStack>
  ),
};

export const ContainerSizes: Story = {
  render: () => (
    <StoryStack>
      <Container size="sm">
        <p className="m-0">Size sm</p>
      </Container>
      <Container size="md">
        <p className="m-0">Size md</p>
      </Container>
      <Container size="lg">
        <p className="m-0">Size lg</p>
      </Container>
    </StoryStack>
  ),
};

export const ContainerStates: Story = {
  render: () => (
    <Container>
      <p className="m-0">Default state only; containers are structural.</p>
    </Container>
  ),
};

export const ContainerEdgeCases: Story = {
  render: () => (
    <StoryStack>
      <Container>
        <p className="m-0">{storyText.veryLong}</p>
      </Container>
      <Container>
        <p className="m-0">—</p>
      </Container>
    </StoryStack>
  ),
};

export const ContainerDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <Container>
      <p className="m-0">Container in dark mode</p>
    </Container>
  ),
};

export const ContainerAccessibility: Story = {
  render: () => (
    <Container aria-label="Container region">
      <p className="m-0">Use aria-label when container is a meaningful region.</p>
    </Container>
  ),
};
