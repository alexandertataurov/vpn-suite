import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface CodeBlockProps {
  value: string;
  language?: "ini" | "conf" | "text";
  maxHeight?: number;
  wrap?: boolean;
  actions?: ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function CodeBlock({
  value,
  language = "text",
  maxHeight,
  wrap = true,
  actions,
  className,
  "data-testid": dataTestId,
}: CodeBlockProps) {
  return (
    <div
      className={cn("code-block", className)}
      data-testid={dataTestId}
    >
      {actions ? (
        <div className="code-block-actions">
          {actions}
        </div>
      ) : null}
      <pre
        className={cn(
          "code-block-pre",
          wrap ? "code-block-pre-wrap" : "code-block-pre-nowrap"
        )}
        style={
          {
          "--code-block-max-height": maxHeight != null ? `${maxHeight}px` : undefined,
          } as CSSProperties
        }
        lang={language}
      >
        {value}
      </pre>
    </div>
  );
}
