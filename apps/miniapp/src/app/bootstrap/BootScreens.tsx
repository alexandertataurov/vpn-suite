import { BootstrapLoading } from "./BootstrapLoading";
import { BootstrapLoadingSlow } from "./BootstrapLoadingSlow";
import { BrandSplash } from "./BrandSplash";
import { StartupError } from "./StartupError";

export function BootLoadingScreen({
  slowNetwork,
  onRetry,
}: {
  slowNetwork: boolean;
  onRetry: () => void;
}) {
  if (slowNetwork) {
    return <BootstrapLoadingSlow onRetry={onRetry} />;
  }
  return <BootstrapLoading />;
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
    <StartupError
      title={title}
      message={debug ? `${message} Debug: ${debug}` : message}
      onRetry={onRetry}
    />
  );
}

export function BrandSplashScreen() {
  return <BrandSplash />;
}
