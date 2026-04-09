interface SpinnerProps {
  className?: string;
  "aria-label"?: string;
}

export function Spinner({ className = "", "aria-label": ariaLabel = "Loading" }: SpinnerProps) {
  return (
    <span className={`spinner ${className}`.trim()} role="status" aria-label={ariaLabel}>
      <span className="spinner__dot" aria-hidden />
    </span>
  );
}
