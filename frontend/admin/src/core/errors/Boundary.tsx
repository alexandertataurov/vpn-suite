import { Component, type ErrorInfo, type ReactNode } from "react";
import { mapApiErrorToAppError } from "./map";

interface Props {
  children: ReactNode;
  onReportError?: (error: Error, componentStack: string | null) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onReportError?.(error, info.componentStack ?? null);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const appError = mapApiErrorToAppError(this.state.error);
      return (
        <div className="error-boundary" role="alert">
          <h2 className="error-boundary__title">Something went wrong</h2>
          <p className="error-boundary__message">{appError.userMessage}</p>
          <div className="error-boundary__actions">
            <button type="button" className="error-boundary__btn" onClick={this.handleRetry}>
              Try again
            </button>
            <button type="button" className="error-boundary__btn" onClick={this.handleReload}>
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
