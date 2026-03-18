import { IconChevronRight, IconPencil } from "@/design-system/icons";
import { ListCard, ListRow, PageSection } from "@/design-system";
import { LanguageMenuRow } from "./LanguageMenuRow";
import type { LanguageOption } from "./LanguageMenuRow";

export interface ProfileSectionProps {
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
  languageActiveId: LanguageOption["id"];
  localeOptions: LanguageOption[];
  onLocaleSelect: (id: LanguageOption["id"]) => void;
}

export function ProfileSection({
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
}: ProfileSectionProps) {
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
        <LanguageMenuRow
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
