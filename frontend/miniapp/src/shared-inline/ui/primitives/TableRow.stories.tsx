import type { Meta, StoryObj } from "@storybook/react";
import { TableRow } from "./TableRow";
import { TableCell } from "./TableCell";
import { StoryStack, NarrowFrame } from "../../storybook/wrappers";
import { storyText } from "../../storybook/fixtures";

const meta: Meta<typeof TableRow> = {
  title: "Shared/Primitives/TableRow",
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

export const TableRowOverview: Story = {
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

export const TableRowVariants: Story = {
  render: () => (
    <table className="ds-table">
      <tbody>
        <DemoRow label="Default" />
        <DemoRow label="Hover (visual)" />
      </tbody>
    </table>
  ),
};

export const TableRowSizes: Story = {
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

export const TableRowStates: Story = {
  render: () => (
    <table className="ds-table">
      <tbody>
        <DemoRow label="Default" />
      </tbody>
    </table>
  ),
};

export const TableRowEdgeCases: Story = {
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

export const TableRowDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  render: () => (
    <table className="ds-table">
      <tbody>
        <DemoRow label="Connections" />
      </tbody>
    </table>
  ),
};

export const TableRowAccessibility: Story = {
  render: () => (
    <table className="ds-table" aria-label="Table row demo">
      <tbody>
        <DemoRow label="Accessible row" />
      </tbody>
    </table>
  ),
};
