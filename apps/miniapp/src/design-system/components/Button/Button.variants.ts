import type { ButtonVariant, ButtonSize, ButtonTone } from "./Button.types";

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn--primary",
  secondary: "btn--secondary",
  danger: "btn--danger",
  external: "btn--external",
  ghost: "btn--secondary",
  outline: "btn--secondary",
  link: "btn--secondary",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
  icon: "btn-sm btn-icon",
};

const toneClass: Record<Exclude<ButtonTone, "default">, string> = {
  success: "btn--tone-success",
  warning: "btn--tone-warning",
  danger: "btn--tone-danger",
};

export { variantClass, sizeClass, toneClass };

export function getButtonVariantClass(variant: ButtonVariant): string {
  return variantClass[variant];
}

export function getButtonSizeClass(size: ButtonSize): string {
  return size === "icon" ? "btn-sm btn-icon" : sizeClass[size];
}

export function getButtonToneClass(tone: ButtonTone | undefined): string {
  return tone && tone !== "default" ? toneClass[tone] : "";
}

/** Class string for link-styled-as-button (e.g. ButtonLink). */
export function getButtonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = ""
): string {
  const sizeCls = size === "icon" ? "btn-sm btn-icon" : sizeClass[size];
  return `btn ${variantClass[variant]} ${sizeCls} ${extra}`.trim();
}
