import type { Meta, StoryObj } from "@storybook/react";
import { DataGrid, DataCell } from "./DataGrid";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof DataGrid> = {
  title: "Patterns/DataGrid",
  tags: ["autodocs"],
  component: DataGrid,
  parameters: {
    layout: "padded",
    status: { type: "stable" },
    docs: {
      description: {
        component:
          "Key/value data grid. DataCell supports label, value, tone, loading, and tooltip states.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Compact 2-column key/value summary for a connected device or server.",
      },
    },
  },
  render: () => (
    <StoryShowcase>
      <DataGrid columns={2}>
        <DataCell label="Latency" value="45 ms" valueTone="green" />
        <DataCell label="Region" value="US" valueTone="teal" />
        <DataCell label="Load" value="12%" valueTone="green" />
        <DataCell label="Status" value="Connected" valueTone="green" />
      </DataGrid>
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Tones and one-column versus two-column layouts.">
      <StoryShowcase>
        <StoryStack>
          <DataGrid columns={2}>
            <DataCell label="Latency" value="45 ms" valueTone="green" />
            <DataCell label="Region" value="US" valueTone="teal" />
            <DataCell label="Load" value="92%" valueTone="red" />
            <DataCell label="IP" value="10.0.0.1" valueTone="ip" />
          </DataGrid>
          <DataGrid columns={1}>
            <DataCell label="Latency" value="45 ms" valueTone="green" />
            <DataCell label="Region" value="US" valueTone="teal" />
          </DataGrid>
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};

export const Loading: Story = {
  render: () => (
    <StorySection title="Loading" description="Indeterminate cell state while values resolve.">
      <StoryShowcase>
        <DataGrid columns={2}>
          <DataCell label="Latency" value="" loading />
          <DataCell label="Region" value="US" valueTone="teal" />
        </DataGrid>
      </StoryShowcase>
    </StorySection>
  ),
};
