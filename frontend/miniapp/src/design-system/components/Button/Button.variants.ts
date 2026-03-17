import type { ButtonVariant, ButtonSize } from "./Button.types";

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  outline: "btn-outline",
  danger: "btn-danger",
  link: "btn-link",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
  icon: "btn-icon",
};

export { variantClass, sizeClass };

export function getButtonVariantClass(variant: ButtonVariant): string {
  return variantClass[variant];
}

export function getButtonSizeClass(size: ButtonSize): string {
  return size === "icon" ? "btn-md btn-icon" : sizeClass[size];
}

/** Class string for link-styled-as-button (e.g. ButtonLink). */
export function getButtonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = ""
): string {
  const sizeCls = size === "icon" ? "btn-md btn-icon" : sizeClass[size];
  return `btn ${variantClass[variant]} ${sizeCls} ${extra}`.trim();
}
