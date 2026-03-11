import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "../components/forms/Textarea";
import { Stack } from "../primitives";
import { StoryCard, StoryPage, StorySection, ThreeColumn, UsageExample } from "./foundations.story-helpers";

const meta = {
  title: "Primitives/Textarea",
  tags: ["autodocs"],
  component: Textarea,
  parameters: {
    docs: {
      description: {
        component: "Mobile-safe textarea with optional label, helper, success, and error handling. Resize chrome is removed in favor of a fixed mobile growth range.",
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
      <StoryPage
        eyebrow="Components"
        title="Textarea"
        summary="Textarea is the multi-line companion to Input and starts at a comfortable mobile height with no visible resize handle."
        stats={[
          { label: "Modes", value: "bare + wrapped" },
          { label: "Height", value: "120px to 240px" },
          { label: "Examples", value: "3" },
        ]}
    >
      <StorySection
        title="Textarea states"
        description="Use Textarea when the user needs to provide audit notes, support detail, or structured reasoning."
      >
        <ThreeColumn>
          <StoryCard title="Bare textarea" caption="Standalone when the parent shell already labels the section.">
            <Textarea placeholder="Write a short note…" rows={4} />
          </StoryCard>
          <StoryCard title="Wrapped textarea" caption="Default usage with a label and contextual helper copy.">
            <Textarea label="Reason" placeholder="Explain why this action is needed." description="Required for the audit log." required />
          </StoryCard>
          <StoryCard title="Validation and disabled" caption="Long-form input should still read clearly in error or disabled states.">
            <Stack gap="2">
              <Textarea label="Reason" placeholder="Explain why this action is needed." error="Reason is required" />
              <Textarea label="Notes" placeholder="Disabled text area" disabled />
            </Stack>
          </StoryCard>
        </ThreeColumn>
      </StorySection>

      <StorySection
        title="Miniapp showcase"
        description="Danger and support flows often require longer-form reasoning; Textarea keeps those moments inside the same form system."
      >
        <UsageExample title="Audit justification" description="The label carries the task and the textarea carries the explanation without extra wrapper code.">
          <Textarea label="Audit reason" placeholder="Document why the config was reissued." rows={4} />
        </UsageExample>
      </StorySection>
    </StoryPage>
  ),
};

export const Default: Story = {
  args: { placeholder: "Write a short note…" },
};

export const WithLabel: Story = {
  args: { label: "Reason", placeholder: "Explain why this action is needed." },
};

export const WithError: Story = {
  args: { label: "Reason", placeholder: "Explain why this action is needed.", error: "Reason is required" },
};

export const Disabled: Story = {
  args: { label: "Notes", placeholder: "Disabled text area", disabled: true },
};

export const InStack: Story = {
  render: () => (
    <Stack gap="2">
      <Textarea label="Support summary" placeholder="Describe the issue" rows={3} />
      <Textarea label="Internal notes" placeholder="Optional notes" rows={3} />
    </Stack>
  ),
};
