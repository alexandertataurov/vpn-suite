import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/telemetry/errors";
import { Button, Body } from "@/design-system";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

/**
 * React error boundary for the app shell.
 * Catches render/lifecycle errors and shows a recovery UI instead of blank screen.
 * Global handlers (telemetry/errors) catch unhandledrejection/window.error;
 * React errors during render bypass those and require this boundary.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (typeof window !== "undefined" && "console" in window) {
      console.error("[AppErrorBoundary]", error, errorInfo.componentStack);
    }
    reportError(error, {
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="splash-screen app-error-fallback" role="alert" aria-live="assertive">
          <div className="splash-screen-content">
            <Body className="splash-screen-tagline">Something went wrong.</Body>
            <Button
              variant="primary"
              size="lg"
              className="splash-screen-cta"
              onClick={this.handleRetry}
              aria-label="Retry"
            >
              Retry
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
