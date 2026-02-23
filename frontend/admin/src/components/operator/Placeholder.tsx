export interface PlaceholderProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Placeholder({ children, className, title }: PlaceholderProps) {
  return (
    <p
      className={`operator-placeholder${className ? ` ${className}` : ""}`}
      title={title}
    >
      {children}
    </p>
  );
}
