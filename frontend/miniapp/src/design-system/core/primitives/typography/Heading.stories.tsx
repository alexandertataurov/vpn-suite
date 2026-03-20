import type { Meta, StoryObj } from "@storybook/react";
import { Heading, Stack } from "../index";
import { StorySection, StoryShowcase } from "@/design-system";

const meta: Meta<typeof Heading> = {
  title: "Primitives/Heading",
  component: Heading,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Semantic heading levels for content hierarchy. Use levels 1-4 instead of styling generic text to look like a heading.",
      },
    },
  },
  argTypes: {
    level: { control: "select", options: [1, 2, 3, 4] },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Heading",
    level: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Default level-1 heading for page titles and top-level sections.",
      },
    },
  },
};

export const Levels: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Levels 1 through 4 displayed together so you can check the heading scale quickly.",
      },
    },
  },
  render: () => (
    <StorySection title="Levels" description="The same component maps to semantic levels 1 through 4.">
      <StoryShowcase>
        <Stack gap="4">
          <Heading level={1}>Heading 1</Heading>
          <Heading level={2}>Heading 2</Heading>
          <Heading level={3}>Heading 3</Heading>
          <Heading level={4}>Heading 4</Heading>
        </Stack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const SemanticMapping: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Document-structure examples showing which heading level to use for page and section titles.",
      },
    },
  },
  render: () => (
    <StorySection title="Semantic mapping" description="Choose the level that matches the document structure, not just the visual size.">
      <StoryShowcase>
        <Stack gap="6">
          <MappingExample label="level=1 → page title" level={1}>
            Page Title
          </MappingExample>
          <MappingExample label="level=2 → section title" level={2}>
            Section Title
          </MappingExample>
        </Stack>
      </StoryShowcase>
    </StorySection>
  ),
};

function MappingExample({
  label,
  level,
  children,
}: {
  label: string;
  level: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--typo-caption-size)",
          color: "var(--color-text-muted)",
          marginBottom: "var(--spacing-2)",
        }}
      >
        {label}
      </div>
      <Heading level={level}>{children}</Heading>
    </div>
  );
}
