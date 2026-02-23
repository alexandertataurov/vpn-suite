import type { ReactNode } from "react";

export interface InlineErrorProps {
  message: ReactNode;
  id?: string;
}

export function InlineError({ message, id }: InlineErrorProps) {
  return (
    <p id={id} className="input-error-msg" role="alert">
      {message}
    </p>
  );
}
