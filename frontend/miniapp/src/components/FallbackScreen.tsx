import { Button, InlineAlert, getButtonClassName } from "@vpn-suite/shared/ui";

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
    <div className="page-content">
      <InlineAlert variant="error" title={title} message={message} className="mb-md" />
      <div className="miniapp-quick-actions">
        {onRetry && (
          <Button variant="primary" size="lg" onClick={onRetry}>
            Try again
          </Button>
        )}
        <a
          href={contactSupportHref}
          target="_blank"
          rel="noopener noreferrer"
          className={getButtonClassName("secondary", "lg")}
        >
          Contact support
        </a>
      </div>
    </div>
  );
}
