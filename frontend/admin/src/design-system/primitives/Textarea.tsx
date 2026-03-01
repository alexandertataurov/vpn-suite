import type { TextareaHTMLAttributes, ReactNode } from "react";
import { forwardRef, useEffect, useRef } from "react";
import { cn } from "@vpn-suite/shared";
import { Field } from "../layout/Field";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
  label?: ReactNode;
  description?: ReactNode;
  autoResize?: boolean;
  className?: string;
}

function adjustHeight(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => {
    const { error, label, description, autoResize = false, className, value, onChange, id: idProp, ...rest } = props;
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const id = idProp ?? (typeof label === "string" ? label.toLowerCase().replace(/\s/g, "-") : undefined);
    const setRef = (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };
    useEffect(() => { if (autoResize) adjustHeight(internalRef.current); }, [autoResize, value]);
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) adjustHeight(e.target);
      onChange?.(e);
    };
    const textarea = (
      <textarea
        ref={setRef}
        id={id}
        className={cn("ds-textarea", !!error && "ds-textarea--error", className)}
        data-error={!!error || undefined}
        value={value}
        onChange={handleChange}
        {...rest}
      />
    );
    if (label != null || description != null || typeof error === "string") {
      return (
        <Field id={id} label={label} description={description} error={typeof error === "string" ? error : undefined}>
          {textarea}
        </Field>
      );
    }
    return textarea;
  }
);

Textarea.displayName = "Textarea";
