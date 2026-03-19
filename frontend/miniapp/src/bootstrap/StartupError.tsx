import { BootScreen, Button, InlineAlert } from "@/design-system";
import "./StartupError.css";

export interface StartupErrorProps {
  title?: string;
  message?: string;
  onRetry: () => void;
}

export function StartupError({
  title = "Could not load session",
  message = "Please try again. If the issue persists, check your connection.",
  onRetry,
}: StartupErrorProps) {
  return (
    <BootScreen iconState="error" showProgress={false}>
      <div className="boot-error-content">
        <InlineAlert variant="error" label={title} message={message} />
        <Button variant="secondary" size="sm" onClick={onRetry} aria-label="Retry">
          Retry
        </Button>
      </div>
    </BootScreen>
  );
}
