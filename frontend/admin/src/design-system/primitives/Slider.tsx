import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";

type SliderVariant = "default" | "success" | "warning" | "danger";

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  variant?: SliderVariant;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { variant = "default", className = "", ...props },
  ref
) {
  const variantClass =
    variant === "success" || variant === "warning" || variant === "danger" ? variant : null;

  return (
    <input
      {...props}
      ref={ref}
      type="range"
      className={[variantClass, className || null].filter(Boolean).join(" ")}
    />
  );
});

