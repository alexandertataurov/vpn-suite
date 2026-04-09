import { EmptyStateBlock } from "../../patterns";
import "./DevicesEmptyState.css";

export interface DevicesEmptyStateProps {
  title: string;
  message: string;
}

export function DevicesEmptyState({ title, message }: DevicesEmptyStateProps) {
  return (
    <EmptyStateBlock
      className="devices-empty-card"
      title={title}
      message={message}
    />
  );
}
