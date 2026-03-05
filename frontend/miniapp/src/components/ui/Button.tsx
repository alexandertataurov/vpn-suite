import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as BaseButton } from "../../ui";

export interface TelegramButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  fullWidth?: boolean;
}

function composeClassName(kind: string, className?: string, fullWidth?: boolean): string {
  return ["ds-button", kind, fullWidth ? "ds-button-full" : "", className ?? ""].filter(Boolean).join(" ");
}

export function PrimaryButton({ children, className, fullWidth = false, ...props }: TelegramButtonProps) {
  return (
    <BaseButton
      variant="primary"
      size="lg"
      className={composeClassName("ds-button-primary", className, fullWidth)}
      {...props}
    >
      {children}
    </BaseButton>
  );
}

export function SecondaryButton({ children, className, fullWidth = false, ...props }: TelegramButtonProps) {
  return (
    <BaseButton
      variant="secondary"
      size="lg"
      className={composeClassName("ds-button-secondary", className, fullWidth)}
      {...props}
    >
      {children}
    </BaseButton>
  );
}

export function GhostButton({ children, className, fullWidth = false, ...props }: TelegramButtonProps) {
  return (
    <BaseButton
      variant="ghost"
      size="lg"
      className={composeClassName("ds-button-ghost", className, fullWidth)}
      {...props}
    >
      {children}
    </BaseButton>
  );
}

export function DangerButton({ children, className, fullWidth = false, ...props }: TelegramButtonProps) {
  return (
    <BaseButton
      variant="danger"
      size="lg"
      className={composeClassName("ds-button-danger", className, fullWidth)}
      {...props}
    >
      {children}
    </BaseButton>
  );
}

export interface ButtonStackProps {
  children: ReactNode;
  className?: string;
}

export function ButtonStack({ children, className = "" }: ButtonStackProps) {
  return <div className={`ds-button-group ${className}`.trim()}>{children}</div>;
}
