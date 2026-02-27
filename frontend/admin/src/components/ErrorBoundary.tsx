import { Component, type ErrorInfo, type ReactNode } from "react";
import { PageError } from "@vpn-suite/shared/ui";
import { error as reportTelemetryError } from "../telemetry";

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
    reportTelemetryError(error, {
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
      component_stack: componentStack ?? null,
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
