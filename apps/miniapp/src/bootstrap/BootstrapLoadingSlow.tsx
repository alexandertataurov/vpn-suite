import { BootScreen, Button } from "@/design-system";
import { BootstrapSkeleton } from "./BootstrapSkeleton";
import "./BootstrapLoadingSlow.css";

export interface BootstrapLoadingSlowProps {
  onRetry: () => void;
}

export function BootstrapLoadingSlow({ onRetry }: BootstrapLoadingSlowProps) {
  return (
    <BootScreen iconState="default" showProgress>
      <BootstrapSkeleton />
      <div className="boot-slow-hint">
        <p className="boot-hint-text">Still connecting. You can retry now.</p>
        <Button variant="secondary" size="sm" onClick={onRetry} aria-label="Retry connection">
          Retry
        </Button>
      </div>
    </BootScreen>
  );
}
