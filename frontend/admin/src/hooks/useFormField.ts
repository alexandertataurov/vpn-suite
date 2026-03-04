import { useCallback, useState } from "react";

/**
 * Purpose: Single field state (value, onChange, setValue, reset). Building block for forms.
 * Used in: Custom forms; later with zod/react-hook-form.
 */
export function useFormField<T>(initialValue: T): {
  value: T;
  onChange: (value: T) => void;
  setValue: (value: T) => void;
  reset: () => void;
} {
  const [value, setValue] = useState<T>(initialValue);
  const onChange = useCallback((v: T) => setValue(v), []);
  const reset = useCallback(() => setValue(initialValue), [initialValue]);
  return { value, onChange, setValue, reset };
}
