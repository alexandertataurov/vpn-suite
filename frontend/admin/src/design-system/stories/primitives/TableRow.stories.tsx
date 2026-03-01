import type { Meta, StoryObj } from "@storybook/react";
import { TableRow, TableCell } from "@/design-system";
import { StoryStack, NarrowFrame } from "../storybook/wrappers";
import { storyText } from "../storybook/fixtures";

const meta: Meta<typeof TableRow> = {
  title: "Primitives/TableRow",
  component: TableRow,
};

export default meta;

type Story = StoryObj<typeof TableRow>;

function DemoRow({ label }: { label: string }) {
  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell align="right" numeric>
        42
      </TableCell>
    </TableRow>
  );
}

export const Overview: Story = {
  render: () => (
    <table className="ds-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th className="text-right">Value</th>
        </tr>
      </thead>
      <tbody>
        <DemoRow label="Connections" />
        <DemoRow label="Errors" />
      </tbody>
    </table>
  ),
};

export const Variants: Story = {
  render: () => (
    <table className="ds-table">
      <tbody>
        <DemoRow label="Default" />
        <DemoRow label="Hover (visual)" />
      </tbody>
    </table>
  ),
};

export const Sizes: Story = {
  render: () => (
    <StoryStack>
      <table className="ds-table">
        <tbody>
          <DemoRow label="Comfortable" />
        </tbody>
      </table>
      <table className="ds-table ds-table-density-compact">
        <tbody>
          <DemoRow label="Compact" />
        </tbody>
      </table>
    </StoryStack>
  ),
};

export const States: Story = {
  render: () => (
    <table className="ds-table">
      <tbody>
        <DemoRow label="Default" />
      </tbody>
    </table>
  ),
};

export const EdgeCases: Story = {
  render: () => (
    <StoryStack>
      <table className="ds-table">
        <tbody>
          <DemoRow label={storyText.veryLong} />
        </tbody>
      </table>
      <NarrowFrame>
        <table className="ds-table">
          <tbody>
            <DemoRow label={storyText.longLabel} />
          </tbody>
        </table>
      </NarrowFrame>
    </StoryStack>
  ),
};

export const DarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <table className="ds-table">
      <tbody>
        <DemoRow label="Connections" />
      </tbody>
    </table>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <table className="ds-table" aria-label="Table row demo">
      <tbody>
        <DemoRow label="Accessible row" />
      </tbody>
    </table>
  ),
};
