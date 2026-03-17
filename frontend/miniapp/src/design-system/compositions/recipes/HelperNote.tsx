import type { HTMLAttributes, ReactNode } from "react";

export interface HelperNoteProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  tone?: "default" | "info" | "warning" | "danger";
  children: ReactNode;
}

export function HelperNote({
  title,
  tone = "default",
  children,
  className = "",
  ...props
}: HelperNoteProps) {
  return (
    <div className={["helper-note", `helper-note--${tone}`, className].filter(Boolean).join(" ")} {...props}>
      {title ? <div className="helper-note__title">{title}</div> : null}
      <div className="helper-note__body">{children}</div>
    </div>
  );
}
