import { ErrorBoundary } from "@/core/errors/Boundary";
import { AppRouter } from "./app/router";

function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}

export { App };
