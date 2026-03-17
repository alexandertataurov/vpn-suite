import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Intent, Size } from "../../utils/types";

export type ButtonVariant = Intent;

export type ButtonSize = Extract<Size, "sm" | "md" | "lg" | "icon">;

export type ButtonTone = "default" | "warning" | "danger" | "success";

export type ButtonStatus = "idle" | "loading" | "success" | "error";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  kind?: "default" | "connect";
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  iconOnly?: boolean;
  status?: ButtonStatus;
  statusText?: string;
  successText?: string;
  errorText?: string;
  asChild?: boolean;
  children?: ReactNode;
}
