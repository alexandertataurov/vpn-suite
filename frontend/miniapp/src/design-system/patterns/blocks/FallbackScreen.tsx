import { PageStateScreen } from "./PageStateScreen";
import { MissionPrimaryButton, MissionSecondaryAnchor } from "../mission/Mission";
import { useI18n } from "@/hooks/useI18n";

export interface FallbackScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  contactSupportHref?: string;
}

export function FallbackScreen({
  title,
  message,
  onRetry,
  contactSupportHref = "https://t.me/support",
}: FallbackScreenProps) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t("common.could_not_load_title");
  const resolvedMessage = message ?? t("common.could_not_load_generic");

  return (
    <PageStateScreen
      panelTone="red"
      label="System Error"
      chipTone="red"
      chipText="Blocked"
      alertTone="error"
      alertTitle={resolvedTitle}
      alertMessage={resolvedMessage}
      actions={
        <>
          {onRetry && (
            <MissionPrimaryButton onClick={onRetry}>
              {t("common.try_again")}
            </MissionPrimaryButton>
          )}
          <MissionSecondaryAnchor
            aria-label={t("common.contact_support")}
            href={contactSupportHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("common.contact_support")}
          </MissionSecondaryAnchor>
        </>
      }
    />
  );
}
