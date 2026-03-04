import type { Meta, StoryObj } from "@storybook/react";
import { Pagination } from "./Table";
import { StoryStack, NarrowFrame } from "../../storybook/wrappers";

const meta: Meta<typeof Pagination> = {
  title: "Shared/Components/Pagination",
  component: Pagination,
  argTypes: {
    offset: { control: "number" },
    limit: { control: "number" },
    total: { control: "number" },
  },
};

export default meta;

type Story = StoryObj<typeof Pagination>;

export const PaginationOverview: Story = {
  args: { offset: 0, limit: 25, total: 240, onPage: () => {} },
};

export const PaginationVariants: Story = {
  render: () => (
    <StoryStack>
      <Pagination offset={0} limit={25} total={240} onPage={() => {}} />
      <Pagination offset={50} limit={25} total={240} onPage={() => {}} />
    </StoryStack>
  ),
};

export const PaginationSizes: Story = {
  render: () => (
    <StoryStack>
      <Pagination offset={0} limit={10} total={100} onPage={() => {}} />
      <Pagination offset={0} limit={50} total={100} onPage={() => {}} />
    </StoryStack>
  ),
};

export const PaginationStates: Story = {
  render: () => (
    <StoryStack>
      <Pagination offset={0} limit={25} total={25} onPage={() => {}} />
      <Pagination offset={0} limit={25} total={0} onPage={() => {}} />
    </StoryStack>
  ),
};

export const PaginationEdgeCases: Story = {
  render: () => (
    <StoryStack>
      <Pagination offset={0} limit={1} total={9999} onPage={() => {}} />
      <NarrowFrame>
        <Pagination offset={0} limit={25} total={240} onPage={() => {}} />
      </NarrowFrame>
    </StoryStack>
  ),
};

export const PaginationDarkMode: Story = {
  parameters: { themes: { themeOverride: "dark" } },
  args: { offset: 0, limit: 25, total: 240, onPage: () => {} },
};

export const PaginationAccessibility: Story = {
  args: { offset: 0, limit: 25, total: 240, onPage: () => {} },
};
