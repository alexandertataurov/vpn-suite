import { useId, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Label } from "./Label";
import { HelperText } from "./HelperText";

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export type RadioGroupDirection = "vertical" | "horizontal";

export interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  label?: ReactNode;
  description?: ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  direction?: RadioGroupDirection;
  className?: string;
  id?: string;
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  label,
  description,
  error,
  required = false,
  disabled = false,
  direction = "vertical",
  className = "",
  id: idProp,
}: RadioGroupProps) {
  const generatedId = useId();
  const id = idProp ?? `radio-${generatedId}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : description ? hintId : undefined;

  return (
    <fieldset
      className={cn("radio-group", className)}
      aria-invalid={!!error}
      aria-describedby={describedBy}
      disabled={disabled}
    >
      {label != null ? (
        <Label as="legend" required={required} className="radio-group-legend">
          {label}
        </Label>
      ) : null}

      <div className="radio-options" data-direction={direction}>
        {options.map((opt) => {
          const optionId = `${id}-${opt.value}`;
          const isDisabled = disabled || Boolean(opt.disabled);
          return (
            <label
              key={opt.value}
              htmlFor={optionId}
              className={cn("radio-option", isDisabled && "radio-option-disabled")}
            >
              <input
                id={optionId}
                className="radio-input"
                type="radio"
                name={name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                disabled={isDisabled}
              />
              <span className="radio-option-text">
                <span>{opt.label}</span>
                {opt.description != null ? (
                  <span className="radio-option-hint">{opt.description}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      {description != null && !error ? (
        <HelperText variant="hint" id={hintId}>
          {description}
        </HelperText>
      ) : null}
      {error != null && error !== "" ? (
        <HelperText variant="error" role="alert" id={errorId}>
          {error}
        </HelperText>
      ) : null}
    </fieldset>
  );
}

