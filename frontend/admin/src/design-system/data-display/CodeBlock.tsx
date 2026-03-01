import type { CSSProperties, ReactNode } from "react";
import { useCallback } from "react";
import { useToast } from "../feedback/Toast";
import { cn } from "@vpn-suite/shared";
import { IconCopy } from "@/design-system/icons";

export interface CodeBlockProps {
  code?: string;
  value?: string;
  language?: string;
  maxHeight?: number;
  wrap?: boolean;
  actions?: ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function CodeBlock(props: CodeBlockProps) {
  const {
    code,
    value,
    maxHeight,
    wrap = true,
    actions,
    className,
    "data-testid": dataTestId,
  } = props;
  const resolved = code ?? value ?? "";
  const { addToast } = useToast();
  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(resolved).then(() => addToast("Copied to clipboard", "success"));
  }, [resolved, addToast]);
  return (
    <div className={cn("ds-code-block", className)} data-testid={dataTestId}>
      {actions ? <div className="code-block-actions">{actions}</div> : null}
      <pre
        className={cn("ds-code-block__pre", !wrap && "code-block-pre-nowrap")}
        style={
          {
            maxHeight: maxHeight != null ? `${maxHeight}px` : undefined,
            overflowY: maxHeight != null ? "auto" : undefined,
          } as CSSProperties
        }
      >
        <code>{resolved}</code>
      </pre>
      {actions ? null : (
        <button type="button" className="ds-code-block__copy" onClick={handleCopy} aria-label="Copy">
          <IconCopy size={14} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}

CodeBlock.displayName = "CodeBlock";
