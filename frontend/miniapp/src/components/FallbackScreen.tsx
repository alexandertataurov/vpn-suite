import { Button, getButtonClassName } from "../ui";
import { PageStateScreen } from "./PageStateScreen";

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
      panelClassName="card edge er kpi"
      label="System Error"
      chipClassName="chip cr"
      chipText="Blocked"
      alertVariant="error"
      alertTitle={title}
      alertMessage={message}
      actions={
        <>
          {onRetry && (
            <Button variant="primary" size="lg" onClick={onRetry}>
              Try again
            </Button>
          )}
          <a
            aria-label="Contact support"
            href={contactSupportHref}
            target="_blank"
            rel="noopener noreferrer"
            className={getButtonClassName("secondary", "lg")}
          >
            Contact support
          </a>
        </>
      }
    />
  );
}
