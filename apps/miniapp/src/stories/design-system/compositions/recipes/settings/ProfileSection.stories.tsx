import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ProfileSection } from "@/design-system/recipes";
import { StorySection, StoryShowcase, StoryStack } from "@/design-system";

const meta: Meta<typeof ProfileSection> = {
  title: "Recipes/Settings/ProfileSection",
  tags: ["autodocs"],
  component: ProfileSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Settings profile recipe with edit-profile and language rows, moved out of the app wrapper layer.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const localeOptions = [
  { id: "auto" as const, label: "Auto" },
  { id: "en" as const, label: "English" },
  { id: "ru" as const, label: "Русский" },
];

function ProfileSectionWithState({
  initialActiveId = "en",
}: {
  initialActiveId?: "auto" | "en" | "ru";
}) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<"auto" | "en" | "ru">(initialActiveId);
  const summary = localeOptions.find((option) => option.id === activeId)?.label ?? "English";

  return (
    <ProfileSection
      sectionTitle="Profile"
      editProfileTitle="Edit profile"
      editProfileDescription="Name, email, phone"
      onEditProfile={() => {}}
      languageMenuOpen={open}
      onLanguageMenuChange={setOpen}
      menuId="settings-language-menu"
      menuAriaLabel="Language"
      languageLabel="Language"
      languageSummary={summary}
      languageActiveId={activeId}
      localeOptions={localeOptions}
      onLocaleSelect={(id) => {
        setOpen(false);
        setActiveId(id);
      }}
    />
  );
}

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Profile section in its normal collapsed state with language summary text visible.",
      },
    },
  },
  render: () => (
    <StoryShowcase>
      <ProfileSectionWithState />
    </StoryShowcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorySection title="Variants" description="Default locale and auto-detected locale variants.">
      <StoryShowcase>
        <StoryStack>
          <ProfileSectionWithState initialActiveId="en" />
          <ProfileSectionWithState initialActiveId="auto" />
        </StoryStack>
      </StoryShowcase>
    </StorySection>
  ),
};
