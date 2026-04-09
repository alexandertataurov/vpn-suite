import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@vpn-suite/shared";
import { useSheetSwipeDismiss } from "@/design-system/hooks";
import { decrementBlockingOverlayCount, incrementBlockingOverlayCount } from "@/design-system/utils/overlayStack";
import { Field } from "./Field";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "onChange"> {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  required?: boolean;
  helperPosition?: "top" | "bottom";
  id?: string;
  name?: string;
  placeholder?: string;
  loading?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
}

export function Select({
  options,
  value,
  onChange,
  label,
  description,
  error,
  success,
  required = false,
  helperPosition = "bottom",
  id: idProp,
  name,
  placeholder,
  loading = false,
  loadingLabel = "Loading…",
  emptyLabel = "No options",
  className = "",
  disabled,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const id = idProp ?? (typeof label === "string" ? label.toLowerCase().replace(/\s/g, "-") : `select-${generatedId.replace(/:/g, "")}`);
  const [open, setOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const resolvedOptions: SelectOption[] = useMemo(() => {
    if (loading) return [{ value: "", label: loadingLabel, disabled: true }];
    if (options.length > 0) return options;
    return [{ value: "", label: emptyLabel, disabled: true }];
  }, [emptyLabel, loading, loadingLabel, options]);

  const selectedOption = resolvedOptions.find((option) => option.value === value);
  const triggerLabel = selectedOption?.label ?? placeholder ?? emptyLabel;
  const isUnavailable = disabled ?? (loading || options.length === 0);
  const canOpen = !isUnavailable;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    incrementBlockingOverlayCount();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      decrementBlockingOverlayCount();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const swipeGesture = useSheetSwipeDismiss({
    enabled: open,
    onDismiss: () => setOpen(false),
    resolveStartContext: (target) => {
      const startedInHandle = target?.closest(".select-sheet-handle, .select-sheet-header") != null;
      const startedInSheet = target?.closest(".select-sheet") != null;
      if (!startedInHandle && !startedInSheet) {
        return { allowStart: false };
      }
      return {
        allowStart: true,
        scrollElement: startedInSheet ? optionsRef.current : null,
      };
    },
  });

  useEffect(() => {
    if (!sheetRef.current) return;
    if (!open || swipeGesture.offset <= 0) {
      sheetRef.current.style.removeProperty("transform");
      return;
    }

    sheetRef.current.style.transform = `translateY(${swipeGesture.offset}px)`;
  }, [open, swipeGesture.offset]);

  const trigger = (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        id={id}
        type="button"
        className={cn(
          "input",
          "select-trigger",
          error && "input-error",
          open && "select-trigger-open",
          className
        )}
        aria-invalid={!!error}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? `${id}-sheet` : undefined}
        aria-describedby={error && id ? `${id}-error` : undefined}
        disabled={isUnavailable}
        onClick={() => {
          if (canOpen) setOpen(true);
        }}
        {...props}
      >
        <span className={cn("select-trigger-label", !selectedOption && "select-trigger-label-placeholder")}>
          {triggerLabel}
        </span>
        <span className="select-trigger-icon" aria-hidden>▾</span>
      </button>
      {open ? createPortal(
        <div
          className="select-sheet-overlay"
          data-swipe-active={swipeGesture.isDragging ? "true" : "false"}
          data-swipe-ready={swipeGesture.isReady ? "true" : "false"}
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            ref={sheetRef}
            id={`${id}-sheet`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-sheet-title`}
            className="select-sheet"
            data-swipe-state={swipeGesture.isDragging ? "dragging" : "idle"}
            data-swipe-ready={swipeGesture.isReady ? "true" : "false"}
            onClick={(event) => event.stopPropagation()}
            {...swipeGesture.bind}
          >
            <div className="select-sheet-handle" aria-hidden />
            <div className="select-sheet-header">
              <div className="select-sheet-title-wrap">
                <div id={`${id}-sheet-title`} className="select-sheet-title">
                  {label ?? "Select option"}
                </div>
                {description ? <div className="select-sheet-description">{description}</div> : null}
              </div>
              <button
                type="button"
                className="select-sheet-close"
                onClick={() => setOpen(false)}
                aria-label="Close options"
              >
                ×
              </button>
            </div>
            <div
              ref={optionsRef}
              className="select-sheet-options"
              role="listbox"
              aria-label={typeof label === "string" ? label : "Select options"}
            >
              {resolvedOptions.map((option) => {
                const selected = option.value === value;
                return (
                  <button
                    key={option.value || option.label}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      "select-sheet-option",
                      selected && "select-sheet-option-selected"
                    )}
                    disabled={option.disabled}
                    onClick={() => {
                      if (option.disabled) return;
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <span className="select-sheet-option-copy">{option.label}</span>
                    <span className="select-sheet-option-radio" aria-hidden>
                      {selected ? "●" : "○"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );

  if (label != null || description != null || error != null || success != null) {
    return (
      <Field
        id={id}
        label={label}
        required={required}
        description={description}
        error={error}
        success={success}
        helperPosition={helperPosition}
      >
        {trigger}
      </Field>
    );
  }

  return trigger;
}
