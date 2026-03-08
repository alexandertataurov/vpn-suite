import { trackError } from "@vpn-suite/shared";
import { ErrorBoundary } from "@/core/errors/Boundary";
import { AppRouter } from "./app/router";

function App() {
  return (
    <ErrorBoundary
      onReportError={(error, componentStack) => {
        trackError(error.message, {
          stack: error.stack ?? undefined,
          route: window.location.pathname,
          error_code: "ERROR_BOUNDARY",
        });
        if (componentStack) {
          trackError(`component_stack: ${componentStack.slice(0, 500)}`, { route: window.location.pathname });
        }
      }}
    >
      <AppRouter />
    </ErrorBoundary>
  );
}

export { App };
