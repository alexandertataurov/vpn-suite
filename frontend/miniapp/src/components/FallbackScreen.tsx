import { Button, InlineAlert, getButtonClassName, PageScaffold, ActionRow } from "../ui";

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
    <PageScaffold>
      <InlineAlert variant="error" title={title} message={message} />
      <ActionRow className="miniapp-quick-actions" fullWidth>
        {onRetry && (
          <Button variant="primary" size="lg" onClick={onRetry}>
            Try again
          </Button>
        )}
        <a aria-label="Contact support" href={contactSupportHref} target="_blank" rel="noopener noreferrer"
          className={getButtonClassName("secondary", "lg")}
        >
          Contact support
        </a>
      </ActionRow>
    </PageScaffold>
  );
}
