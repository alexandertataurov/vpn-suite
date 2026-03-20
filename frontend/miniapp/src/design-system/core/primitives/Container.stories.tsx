import type { Meta, StoryObj } from "@storybook/react";
import { Container, Stack } from "./index";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof Container> = {
  title: "Primitives/Container",
  component: Container,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Constrained width and consistent padding for page content, forms, and centered layouts. Choose the size token instead of hardcoding max-width.",
      },
    },
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    padding: { control: "select", options: ["sm", "md"] },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Container content — max-width + padding",
    size: "md",
    padding: "md",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Default width-constrained container for regular page content and centered layouts.",
      },
    },
  },
};

export const Sizes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Compare the size tokens to choose the right readable width without hardcoding max-width values.",
      },
    },
  },
  render: () => (
    <StorySection title="Sizes" description="Use the size token to control readable content width.">
      <StoryShowcase>
        <Stack gap="6">
          <Container size="sm" padding="md">
            <ContainerLabel>size=sm (480px max)</ContainerLabel>
          </Container>
          <Container size="md" padding="md">
            <ContainerLabel>size=md (768px max)</ContainerLabel>
          </Container>
          <Container size="lg" padding="md">
            <ContainerLabel>size=lg (960px max)</ContainerLabel>
          </Container>
        </Stack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const PaddingVariants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Padding variants that show how the container maintains rhythm at different densities.",
      },
    },
  },
  render: () => (
    <StorySection title="Padding variants" description="Compact and standard padding tokens.">
      <StoryShowcase>
        <Stack gap="4">
          <Container size="md" padding="sm">
            <TokenBar label="padding=sm" />
          </Container>
          <Container size="md" padding="md">
            <TokenBar label="padding=md" />
          </Container>
        </Stack>
      </StoryShowcase>
    </StorySection>
  ),
};

function ContainerLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "var(--spacing-2)",
        background: "var(--color-surface-2)",
        borderRadius: "var(--radius-sm)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--typo-caption-size)",
        color: "var(--color-text-muted)",
      }}
    >
      {children}
    </div>
  );
}

function TokenBar({ label }: { label: string }) {
  return (
    <>
      <div
        style={{
          background: "var(--color-accent)",
          opacity: 0.2,
          height: 24,
          borderRadius: "var(--radius-sm)",
        }}
      />
      {label}
    </>
  );
}
