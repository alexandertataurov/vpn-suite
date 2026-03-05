import { Skeleton } from "../../ui";

export interface LoaderProps {
  message?: string;
}

export function Loader({ message = "Loading..." }: LoaderProps) {
  return (
    <div role="status" aria-live="polite" className="ds-section">
      <Skeleton variant="card" />
      <p className="ds-caption">{message}</p>
    </div>
  );
}
