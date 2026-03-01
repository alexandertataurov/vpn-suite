import type { Meta, StoryObj } from "@storybook/react";
import { TableCell, TableRow } from "@/design-system";
import { StoryStack, NarrowFrame } from "../storybook/wrappers";
import { storyText } from "../storybook/fixtures";

const meta: Meta<typeof TableCell> = {
  title: "Primitives/TableCell",
  component: TableCell,
  argTypes: {
    align: { control: "select", options: ["left", "center", "right"] },
    truncate: { control: "boolean" },
    numeric: { control: "boolean" },
    mono: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof TableCell>;

export const Overview: Story = {
  render: () => (
    <table className="ds-table">
      <tbody>
        <TableRow>
          <TableCell>Primary cell</TableCell>
          <TableCell align="right" numeric>
            42
          </TableCell>
        </TableRow>
      </tbody>
    </table>
  ),
};

export const Variants: Story = {
  render: () => (
    <table className="ds-table">
      <tbody>
        <TableRow>
          <TableCell truncate title={storyText.veryLong}>{storyText.veryLong}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell numeric align="right">12345</TableCell>
        </TableRow>
        <TableRow>
          <TableCell mono>srv-01a9</TableCell>
        </TableRow>
      </tbody>
    </table>
  ),
};

export const Sizes: Story = {
  render: () => (
    <StoryStack>
      <table className="ds-table">
        <tbody>
          <TableRow>
            <TableCell>Comfortable</TableCell>
          </TableRow>
        </tbody>
      </table>
      <table className="ds-table ds-table-density-compact">
        <tbody>
          <TableRow>
            <TableCell>Compact</TableCell>
          </TableRow>
        </tbody>
      </table>
    </StoryStack>
  ),
};

export const States: Story = {
  render: () => (
    <table className="ds-table">
      <tbody>
        <TableRow>
          <TableCell>Default</TableCell>
          <TableCell align="right" numeric>0</TableCell>
        </TableRow>
      </tbody>
    </table>
  ),
};

export const EdgeCases: Story = {
  render: () => (
    <StoryStack>
      <table className="ds-table">
        <tbody>
          <TableRow>
            <TableCell truncate title={storyText.veryLong}>{storyText.veryLong}</TableCell>
          </TableRow>
        </tbody>
      </table>
      <NarrowFrame>
        <table className="ds-table">
          <tbody>
            <TableRow>
              <TableCell truncate title={storyText.longLabel}>{storyText.longLabel}</TableCell>
            </TableRow>
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
        <TableRow>
          <TableCell>Dark mode cell</TableCell>
        </TableRow>
      </tbody>
    </table>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <table className="ds-table" aria-label="Table cell demo">
      <tbody>
        <TableRow>
          <TableCell>Accessible cell</TableCell>
        </TableRow>
      </tbody>
    </table>
  ),
};
