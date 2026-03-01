export interface InlineErrorProps {
  message: string;
  id?: string;
}

export function InlineError({ message, id }: InlineErrorProps) {
  return (
    <span className="inline-error" role="alert" id={id}>
      {message}
    </span>
  );
}
