import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Select, type SelectOption } from "../components/forms/Select";
import { Stack } from "../primitives";
import { StoryCard, StoryPage, StorySection, ThreeColumn, UsageExample } from "./foundations.story-helpers";

const meta = {
  title: "Components/Select",
  tags: ["autodocs"],
  component: Select,
  parameters: {
    docs: {
      description: {
        component: "Custom mobile select trigger with bottom-sheet option picking, plus label, helper, loading, empty, and validation states.",
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

const OPTIONS: SelectOption[] = [
  { value: "auto", label: "Fastest available" },
  { value: "nl", label: "Amsterdam, NL" },
  { value: "de", label: "Frankfurt, DE" },
];

export const Overview: Story = {
  render: () => <SelectShowcaseDemo />,
};

export const Default: Story = {
  render: () => <SelectDefaultDemo />,
};

export const WithPlaceholder: Story = {
  render: () => <SelectPlaceholderDemo />,
};

export const Loading: Story = {
  render: () => (
    <Select
      label="Server"
      value=""
      onChange={() => {}}
      options={[]}
      loading
      loadingLabel="Loading servers…"
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <Select
      label="Server"
      value=""
      onChange={() => {}}
      options={[]}
      emptyLabel="No servers available"
    />
  ),
};

export const WithError: Story = {
  render: () => <SelectErrorDemo />,
};

export const Disabled: Story = {
  render: () => <SelectDisabledDemo />,
};

function SelectShowcaseDemo() {
  const [value, setValue] = useState("auto");

  return (
    <StoryPage
      eyebrow="Components"
      title="Select"
      summary="Select uses a custom trigger and bottom-sheet list so the miniapp avoids native iOS and Android pickers that break the design system inside Telegram."
      stats={[
        { label: "States", value: "5" },
        { label: "Picker", value: "bottom sheet" },
        { label: "Examples", value: "4" },
      ]}
    >
      <StorySection
        title="State coverage"
        description="The select API owns option lifecycle and picker presentation so product code does not fall back to native mobile spinners."
      >
        <ThreeColumn>
          <StoryCard title="Default" caption="Labeled trigger with the same touch target and border contract as Input.">
            <Select label="Server" description="Select a preferred node." value={value} onChange={setValue} options={OPTIONS} required />
          </StoryCard>
          <StoryCard title="Placeholder" caption="Use for an explicit unselected state without relying on a hidden native option.">
            <Select label="Region" placeholder="Choose a region" value="" onChange={setValue} options={OPTIONS} />
          </StoryCard>
          <StoryCard title="Recovery states" caption="Loading, empty, and error remain inside the same trigger-and-sheet contract.">
            <Stack gap="2">
              <Select label="Server" value="" onChange={() => {}} options={[]} loading loadingLabel="Loading servers…" />
              <Select label="Server" value="" onChange={() => {}} options={[]} emptyLabel="No servers available" />
              <Select label="Server" value={value} onChange={setValue} options={OPTIONS} error="Please select a valid node." />
            </Stack>
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Miniapp showcase"
        description="Server selection is the clearest product use case because the list can legitimately be loading, empty, invalid, or explicitly user-selected."
      >
        <UsageExample title="Preferred node" description="The trigger stays visually identical to the rest of the form while the picker moves into a dedicated mobile sheet.">
          <Select label="Preferred node" description="Override auto-routing when needed." value={value} onChange={setValue} options={OPTIONS} required />
        </UsageExample>
      </StorySection>
    </StoryPage>
  );
}

function SelectDefaultDemo() {
  const [value, setValue] = useState("auto");
  return (
    <Select
      label="Server"
      description="Select a preferred node."
      value={value}
      onChange={setValue}
      options={OPTIONS}
    />
  );
}

function SelectPlaceholderDemo() {
  const [value, setValue] = useState("");
  return (
    <Select
      label="Region"
      placeholder="Choose a region"
      value={value}
      onChange={setValue}
      options={OPTIONS}
    />
  );
}

function SelectErrorDemo() {
  const [value, setValue] = useState("auto");
  return (
    <Select
      label="Server"
      value={value}
      onChange={setValue}
      options={OPTIONS}
      error="Please select a valid node."
    />
  );
}

function SelectDisabledDemo() {
  const [value, setValue] = useState("auto");
  return (
    <Stack gap="2">
      <Select label="Server" value={value} onChange={setValue} options={OPTIONS} disabled />
      <Select label="Server" value={value} onChange={setValue} options={OPTIONS} disabled placeholder="Disabled" />
    </Stack>
  );
}
