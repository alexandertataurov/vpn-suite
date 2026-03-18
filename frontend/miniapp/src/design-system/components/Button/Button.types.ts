import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Intent } from "../../utils/types";

export type ButtonVariant = Intent;

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonTone = "default" | "success" | "warning" | "danger";

export type TransientState = "idle" | "loading" | "success" | "error";

/** Internal status for ButtonPrimitive (maps from TransientState). */
export type ButtonStatus = TransientState;

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
  transientState?: TransientState;
  /** @deprecated Use transientState */
  status?: TransientState;
  /** @deprecated Use loadingText */
  statusText?: string;
  successText?: string;
  errorText?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** @deprecated Use iconLeft */
  startIcon?: ReactNode;
  /** @deprecated Use iconRight */
  endIcon?: ReactNode;
  iconOnly?: boolean;
  asChild?: boolean;
  children?: ReactNode;
}
