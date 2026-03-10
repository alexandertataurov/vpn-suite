import type { HTMLAttributes, ReactNode } from "react";

export interface ListCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  children: ReactNode;
}

/** Content Library 9: list card container with optional title. */
export function ListCard({ title, children, className = "", ...props }: ListCardProps) {
  return (
    <div className={`list-card ${className}`.trim()} {...props}>
      {title != null ? <div className="list-card-title">{title}</div> : null}
      {children}
    </div>
  );
}

export type ListRowIconTone = "g" | "b" | "a" | "r" | "n";

export interface ListRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  icon?: ReactNode;
  iconTone?: ListRowIconTone;
  title: ReactNode;
  subtitle?: ReactNode;
  subtitleMono?: boolean;
  right?: ReactNode;
  rightColumn?: boolean;
}

/** Content Library 9: list row (device, transaction, etc.). */
export function ListRow({
  icon,
  iconTone = "n",
  title,
  subtitle,
  subtitleMono,
  right,
  rightColumn,
  className = "",
  ...props
}: ListRowProps) {
  return (
    <div className={`list-row ${className}`.trim()} {...props}>
      {icon != null ? (
        <div className={`lr-ico ${iconTone}`}>{icon}</div>
      ) : (
        <div className={`lr-ico ${iconTone}`} aria-hidden />
      )}
      <div className="lr-body">
        <div className="lr-title">{title}</div>
        {subtitle != null ? (
          <div className={`lr-sub ${subtitleMono ? "lr-mono" : ""}`.trim()}>{subtitle}</div>
        ) : null}
      </div>
      {right != null ? (
        <div className={`lr-right ${rightColumn ? "lr-right-col" : ""}`.trim()}>{right}</div>
      ) : null}
    </div>
  );
}
