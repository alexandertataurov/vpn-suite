import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";
import { LanguageMenuRow } from "@/design-system/recipes";

const meta: Meta<typeof LanguageMenuRow> = {
  title: "Recipes/Settings/LanguageMenuRow",
  tags: ["autodocs"],
  component: LanguageMenuRow,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Settings row with a language popover menu for auto, English, and Russian locale selection.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const options = [
  { id: "auto", label: "Auto" },
  { id: "en", label: "English" },
  { id: "ru", label: "Русский" },
] as const;

function InteractiveLanguageRow({
  defaultOpen = false,
  activeId = "en",
}: {
  defaultOpen?: boolean;
  activeId?: "auto" | "en" | "ru";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [selected, setSelected] = useState<"auto" | "en" | "ru">(activeId);

  return (
    <LanguageMenuRow
      open={open}
      onOpenChange={setOpen}
      menuId="storybook-language-menu"
      menuAriaLabel="Select language"
      title="Language"
      description="Choose how the miniapp should be displayed."
      value={options.find((option) => option.id === selected)?.label}
      activeId={selected}
      options={[...options]}
      onTriggerClick={() => setOpen((current) => !current)}
      onSelect={(id) => {
        setSelected(id);
        setOpen(false);
      }}
    />
  );
}

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Collapsed language row showing the currently selected locale and the menu trigger.",
      },
    },
  },
  render: () => (
    <StoryShowcase>
      <InteractiveLanguageRow />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection
      title="Variants"
      description="Collapsed current-language row and open language picker state."
    >
      <StoryShowcase>
        <StoryStack>
          <InteractiveLanguageRow activeId="en" />
          <InteractiveLanguageRow defaultOpen activeId="auto" />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
