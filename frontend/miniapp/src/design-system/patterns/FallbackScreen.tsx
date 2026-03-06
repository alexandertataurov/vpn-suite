import { PageStateScreen } from "./PageStateScreen";
import { MissionPrimaryButton, MissionSecondaryAnchor } from "./MissionPrimitives";

export interface FallbackScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  contactSupportHref?: string;
}

export function FallbackScreen({
  title = "Something went wrong",
  message = "We couldn't load this. Please try again or contact support.",
  onRetry,
  contactSupportHref = "https://t.me/support",
}: FallbackScreenProps) {
  return (
    <PageStateScreen
      panelTone="red"
      label="System Error"
      chipTone="red"
      chipText="Blocked"
      alertTone="error"
      alertTitle={title}
      alertMessage={message}
      actions={
        <>
          {onRetry && (
            <MissionPrimaryButton onClick={onRetry}>
              Try again
            </MissionPrimaryButton>
          )}
          <MissionSecondaryAnchor
            aria-label="Contact support"
            href={contactSupportHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact support
          </MissionSecondaryAnchor>
        </>
      }
    />
  );
}
