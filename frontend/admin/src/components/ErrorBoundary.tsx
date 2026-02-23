import { Component, type ErrorInfo, type ReactNode } from "react";
import { PageError } from "@vpn-suite/shared/ui";
import { logFrontendError } from "../utils/logFrontendError";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.reportFrontendError(error, info.componentStack);
  }

  reportFrontendError(error: Error, componentStack: string | null | undefined): void {
    logFrontendError({
      message: error.message,
      stack: error.stack ?? null,
      componentStack: componentStack ?? null,
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="admin-error-boundary">
          <PageError
            title="Something went wrong"
            message="An unexpected error occurred. Try reloading the page."
            onRetry={this.handleReload}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
