import {
  getSupportContactHandle,
  privacyPolicyUrl,
  userAgreementUrl,
} from "@/config/env";
import type { SupportSectionLegalLink } from "@/design-system";
import type { TranslationParams } from "@/lib/i18n";

type TranslateFn = (key: string, params?: TranslationParams) => string;

interface LegalResourceDefinition {
  titleKey: string;
  settingsDescriptionKey: string;
  supportDescriptionKey: string;
  url: string;
}

interface BuildLegalLinksArgs {
  t: TranslateFn;
  openLink: (url: string) => void;
}

interface SupportQuickLink {
  title: string;
  subtitle: string;
  onClick: () => void;
}

const LEGAL_RESOURCE_DEFINITIONS: readonly LegalResourceDefinition[] = [
  {
    titleKey: "settings.privacy_policy_title",
    settingsDescriptionKey: "settings.privacy_policy_description",
    supportDescriptionKey: "support.privacy_policy_description",
    url: privacyPolicyUrl,
  },
  {
    titleKey: "settings.user_agreement_title",
    settingsDescriptionKey: "settings.user_agreement_description",
    supportDescriptionKey: "support.user_agreement_description",
    url: userAgreementUrl,
  },
] as const;

export function buildSettingsLegalLinks({
  t,
  openLink,
}: BuildLegalLinksArgs): SupportSectionLegalLink[] {
  return LEGAL_RESOURCE_DEFINITIONS.map((resource) => ({
    title: t(resource.titleKey),
    description: t(resource.settingsDescriptionKey),
    onClick: () => openLink(resource.url),
  }));
}

export function buildSupportLegalQuickLinks({
  t,
  openLink,
}: BuildLegalLinksArgs): SupportQuickLink[] {
  return LEGAL_RESOURCE_DEFINITIONS.map((resource) => ({
    title: t(resource.titleKey),
    subtitle: t(resource.supportDescriptionKey),
    onClick: () => openLink(resource.url),
  }));
}

export function getSupportContactDescription(t: TranslateFn): string {
  const supportHandle = getSupportContactHandle();

  return supportHandle
    ? t("settings.contact_support_description_with_handle", { handle: supportHandle })
    : t("settings.contact_support_description");
}

export function getSupportCardDescription(t: TranslateFn, fallback?: string): string {
  const supportHandle = getSupportContactHandle();

  return supportHandle
    ? t("support.contact_card_description_with_handle", { handle: supportHandle })
    : (fallback ?? t("support.contact_card_description"));
}
