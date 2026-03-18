import { IconChevronRight, IconPencil } from "@/design-system/icons";
import { ListCard, ListRow, PageSection } from "@/design-system";
import { SettingsLanguageMenuRow } from "./SettingsLanguageMenuRow";
import type { SettingsLanguageOption } from "./SettingsLanguageMenuRow";

export interface SettingsProfileSectionProps {
  sectionTitle: string;
  editProfileTitle: string;
  editProfileDescription: string;
  onEditProfile: () => void;
  languageMenuOpen: boolean;
  onLanguageMenuChange: (open: boolean) => void;
  menuId: string;
  menuAriaLabel: string;
  languageLabel: string;
  languageSummary: string;
  languageActiveId: SettingsLanguageOption["id"];
  localeOptions: SettingsLanguageOption[];
  onLocaleSelect: (id: SettingsLanguageOption["id"]) => void;
}

export function SettingsProfileSection({
  sectionTitle,
  editProfileTitle,
  editProfileDescription,
  onEditProfile,
  languageMenuOpen,
  onLanguageMenuChange,
  menuId,
  menuAriaLabel,
  languageLabel,
  languageSummary,
  languageActiveId,
  localeOptions,
  onLocaleSelect,
}: SettingsProfileSectionProps) {
  return (
    <PageSection id="profile" title={sectionTitle} compact>
      <ListCard className="settings-list-card">
        <ListRow
          icon={<IconPencil size={15} strokeWidth={2} />}
          iconTone="neutral"
          title={editProfileTitle}
          subtitle={editProfileDescription}
          right={<IconChevronRight size={13} strokeWidth={2.5} />}
          onClick={onEditProfile}
        />
        <SettingsLanguageMenuRow
          open={languageMenuOpen}
          onOpenChange={onLanguageMenuChange}
          menuId={menuId}
          menuAriaLabel={menuAriaLabel}
          title={languageLabel}
          description={languageSummary}
          activeId={languageActiveId}
          options={localeOptions}
          onTriggerClick={() => onLanguageMenuChange(!languageMenuOpen)}
          onSelect={(id) => {
            onLanguageMenuChange(false);
            onLocaleSelect(id);
          }}
        />
      </ListCard>
    </PageSection>
  );
}
