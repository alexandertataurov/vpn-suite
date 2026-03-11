import { Button } from "../../components/buttons/Button";
import { MissionPrimaryAnchor, MissionSecondaryAnchor } from "../mission/Mission";
import { PageStateScreen, type PageStateVariant } from "./PageStateScreen";
import { useI18n } from "@/hooks/useI18n";

export type FallbackScenario = "retryable" | "non_retryable" | "auth_failure" | "timeout";

function ordinalAttemptLabel(attempt: number) {
  if (attempt === 1) return "1st";
  if (attempt === 2) return "2nd";
  if (attempt === 3) return "3rd";
  return `${attempt}th`;
}

function fallbackVariantFromScenario(scenario: FallbackScenario): PageStateVariant {
  switch (scenario) {
    case "auth_failure":
      return "blocked";
    case "non_retryable":
      return "fatal";
    case "timeout":
      return "attention";
    case "retryable":
    default:
      return "blocked";
  }
}

export interface FallbackScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  contactSupportHref?: string;
  retryable?: boolean;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  scenario?: FallbackScenario;
  supportLabel?: string;
  retryLabel?: string;
  reauthenticateLabel?: string;
}

export function FallbackScreen({
  title,
  message,
  onRetry,
  contactSupportHref = "https://t.me/support",
  retryable,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  scenario,
  supportLabel,
  retryLabel,
  reauthenticateLabel,
}: FallbackScreenProps) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t("common.could_not_load_title");
  const resolvedMessage = message ?? t("common.could_not_load_generic");
  const resolvedSupportLabel = supportLabel ?? t("common.contact_support");
  const resolvedRetryable = retryable ?? Boolean(onRetry);
  const resolvedScenario =
    scenario ?? (resolvedRetryable ? "retryable" : "non_retryable");
  const resolvedVariant = fallbackVariantFromScenario(resolvedScenario);
  const exhaustedRetries = resolvedRetryable && retryCount >= maxRetries;

  let primaryAction: JSX.Element | null = null;
  let secondaryAction: JSX.Element | null = null;
  let assistiveCopy: string | null = null;

  if (resolvedScenario === "auth_failure") {
    primaryAction = onRetry ? (
      <Button
        variant="primary"
        size="md"
        onClick={onRetry}
        loading={isRetrying}
        loadingText="Re-authenticating…"
        aria-label="Re-authenticate"
      >
        {reauthenticateLabel ?? "Re-authenticate"}
      </Button>
    ) : contactSupportHref ? (
      <MissionPrimaryAnchor href={contactSupportHref} target="_blank" rel="noopener noreferrer">
        {reauthenticateLabel ?? "Re-authenticate"}
      </MissionPrimaryAnchor>
    ) : null;
    secondaryAction = contactSupportHref ? (
      <MissionSecondaryAnchor
        aria-label={resolvedSupportLabel}
        href={contactSupportHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        {resolvedSupportLabel}
      </MissionSecondaryAnchor>
    ) : null;
  } else if (resolvedScenario === "non_retryable" || exhaustedRetries) {
    primaryAction = contactSupportHref ? (
      <MissionPrimaryAnchor href={contactSupportHref} target="_blank" rel="noopener noreferrer">
        {resolvedSupportLabel}
      </MissionPrimaryAnchor>
    ) : null;
    if (exhaustedRetries) {
      assistiveCopy = "Persistent error - contact support";
    }
  } else if (resolvedScenario === "timeout") {
    primaryAction = onRetry ? (
      <Button
        variant="primary"
        size="md"
        onClick={onRetry}
        loading={isRetrying}
        loadingText="Retrying…"
        aria-label="Retry request"
      >
        {retryLabel ?? t("common.try_again")}
      </Button>
    ) : null;
  } else {
    primaryAction = onRetry ? (
      <Button
        variant="primary"
        size="md"
        onClick={onRetry}
        loading={isRetrying}
        loadingText="Retrying…"
        aria-label="Retry request"
      >
        {retryLabel ??
          (retryCount > 0
            ? `Try again (${ordinalAttemptLabel(retryCount + 1)} attempt)`
            : t("common.try_again"))}
      </Button>
    ) : null;
    secondaryAction = contactSupportHref ? (
      <MissionSecondaryAnchor
        aria-label={resolvedSupportLabel}
        href={contactSupportHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        {resolvedSupportLabel}
      </MissionSecondaryAnchor>
    ) : null;
  }

  return (
    <PageStateScreen
      variant={resolvedVariant}
      mode="replace"
      label={resolvedScenario === "auth_failure" ? "Authentication" : "System Error"}
      chipText={
        resolvedScenario === "timeout"
          ? "Attention"
          : resolvedScenario === "non_retryable"
            ? "Fatal"
            : "Blocked"
      }
      alertTitle={resolvedTitle}
      alertMessage={
        <>
          <span>{resolvedMessage}</span>
          {assistiveCopy ? <span className="state-support-copy">{assistiveCopy}</span> : null}
        </>
      }
      actions={
        <>
          {primaryAction}
          {secondaryAction}
        </>
      }
    />
  );
}
