import { useState, useCallback } from "react";

export interface CodeBlockKeyProps {
  /** Public key or code string */
  value: string;
  /** Label for accessibility */
  "aria-label"?: string;
}

/** Code-block style key with COPY button that flashes cyan on success. */
export function CodeBlockKey({
  value,
  "aria-label": ariaLabel = "Public key",
}: CodeBlockKeyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      const t = setTimeout(() => setCopied(false), 800);
      return () => clearTimeout(t);
    } catch {
      /* ignore */
    }
  }, [value]);

  return (
    <div
      className={`code-block-key ${copied ? "code-block-key--copied" : ""}`}
      role="group"
      aria-label={ariaLabel}
    >
      <code className="code-block-key-value">{value}</code>
      <button
        type="button"
        className="code-block-key-copy"
        onClick={handleCopy}
        aria-label="Copy to clipboard"
      >
        {copied ? "COPIED" : "COPY"}
      </button>
    </div>
  );
}
