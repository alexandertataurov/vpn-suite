import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ProfileSection } from "./ProfileSection";
import { StoryShowcase } from "@/design-system";

const meta: Meta<typeof ProfileSection> = {
  title: "Recipes/Settings/ProfileSection",
  tags: ["autodocs"],
  component: ProfileSection,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Profile section with edit profile and language menu rows.",
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

function ProfileSectionWithState() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<"auto" | "en" | "ru">("en");
  const summary = localeOptions.find((o) => o.id === activeId)?.label ?? "English";
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
  render: () => (
    <StoryShowcase>
      <ProfileSectionWithState />
    </StoryShowcase>
  ),
};
