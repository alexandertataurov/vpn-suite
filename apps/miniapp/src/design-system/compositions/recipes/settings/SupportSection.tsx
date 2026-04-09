import {
  IconChevronRight,
  IconFileText,
  IconHelpCircle,
  IconMessageCircle,
  IconShield,
} from "@/design-system/icons";
import { PageSection } from "@/design-system";
import { ListCard, ListRow } from "../../patterns/cards/ListCard";

export interface SupportSectionLegalLink {
  title: string;
  description: string;
  onClick: () => void;
}

export interface SupportSectionProps {
  sectionTitle: string;
  setupGuideTitle: string;
  setupGuideDescription: string;
  onSetupGuideClick: () => void;
  faqTitle: string;
  faqDescription: string;
  onFaqClick: () => void;
  legalLinks?: readonly SupportSectionLegalLink[];
  contactSupportTitle: string;
  contactSupportDescription: string;
  onContactSupportClick: () => void;
}

export function SupportSection({
  sectionTitle,
  setupGuideTitle,
  setupGuideDescription,
  onSetupGuideClick,
  faqTitle,
  faqDescription,
  onFaqClick,
  legalLinks = [],
  contactSupportTitle,
  contactSupportDescription,
  onContactSupportClick,
}: SupportSectionProps) {
  return (
    <PageSection id="support" title={sectionTitle} compact>
      <ListCard className="settings-list-card">
        <ListRow
          icon={<IconShield size={15} strokeWidth={2} />}
          iconTone="neutral"
          title={setupGuideTitle}
          subtitle={setupGuideDescription}
          right={<IconChevronRight size={13} strokeWidth={2.5} />}
          onClick={onSetupGuideClick}
        />
        <ListRow
          icon={<IconHelpCircle size={15} strokeWidth={2} />}
          iconTone="neutral"
          title={faqTitle}
          subtitle={faqDescription}
          right={<IconChevronRight size={13} strokeWidth={2.5} />}
          onClick={onFaqClick}
        />
        {legalLinks.map((link) => (
          <ListRow
            key={link.title}
            icon={<IconFileText size={15} strokeWidth={2} />}
            iconTone="neutral"
            title={link.title}
            subtitle={link.description}
            right={<IconChevronRight size={13} strokeWidth={2.5} />}
            onClick={link.onClick}
          />
        ))}
        <ListRow
          icon={<IconMessageCircle size={15} strokeWidth={2} />}
          iconTone="blue"
          title={contactSupportTitle}
          subtitle={contactSupportDescription}
          right={<IconChevronRight size={13} strokeWidth={2.5} />}
          onClick={onContactSupportClick}
        />
      </ListCard>
    </PageSection>
  );
}
