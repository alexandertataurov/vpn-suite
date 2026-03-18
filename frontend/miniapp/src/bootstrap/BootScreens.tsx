import { IconShield } from "@/design-system/icons";
import { Button, InlineAlert, Skeleton, Display, Body } from "@/design-system";

export function BootLoadingScreen({
  slowNetwork,
  onRetry,
}: {
  slowNetwork: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="splash-screen splash-screen--loading" role="status" aria-live="polite">
      <div className="splash-screen-content bootstrap-loading-content">
        <span className="splash-screen-logo" aria-hidden>
          <IconShield size={42} strokeWidth={1.5} />
        </span>
        <Skeleton variant="card" className="bootstrap-loading-skeleton" />
        {slowNetwork && (
          <>
            <Body className="splash-screen-tagline">Still connecting. You can retry now.</Body>
            <Button variant="secondary" size="md" onClick={onRetry} aria-label="Retry connection">
              Retry
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function BootErrorScreen({
  title,
  message,
  debug,
  onRetry,
}: {
  title: string;
  message: string;
  debug?: string;
  onRetry: () => void;
}) {
  return (
    <div className="splash-screen" role="region" aria-label="Startup error">
      <div className="splash-screen-content">
        <span className="splash-screen-logo" aria-hidden>
          <IconShield size={42} strokeWidth={1.5} />
        </span>
        <InlineAlert variant="error" title={title} message={message} />
        {debug && (
          <Body as="p" className="splash-screen-tagline">
            Debug: {debug}
          </Body>
        )}
        <Button variant="primary" size="lg" className="splash-screen-cta" onClick={onRetry} aria-label="Retry">
          Retry
        </Button>
      </div>
    </div>
  );
}

export function BrandSplashScreen() {
  return (
    <div className="splash-screen" role="region" aria-label="Welcome">
      <div className="splash-screen-content">
        <span className="splash-screen-logo" aria-hidden>
          <IconShield size={48} strokeWidth={1.5} />
        </span>
        <Display as="h1">VPN</Display>
        <Body className="splash-screen-tagline">Secure and private. Starting your onboarding…</Body>
      </div>
    </div>
  );
}
