import type { HTMLAttributes, ReactNode } from "react";
import { BodyText, Caption } from "./Typography";

export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  children: ReactNode;
}

export function List({ children, className = "", ...props }: ListProps) {
  return (
    <ul className={`ds-list ${className}`.trim()} {...props}>
      {children}
    </ul>
  );
}

export interface ListItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "title"> {
  title: ReactNode;
  subtitle?: ReactNode;
  leadingIcon?: ReactNode;
  trailing?: ReactNode;
}

export function ListItem({
  title,
  subtitle,
  leadingIcon,
  trailing,
  className = "",
  ...props
}: ListItemProps) {
  return (
    <li className={`ds-list-item ${className}`.trim()} {...props}>
      <div className="ds-list-item-leading" aria-hidden>
        {leadingIcon}
      </div>
      <div className="ds-list-item-body">
        <BodyText as="p" className="ds-list-item-title">{title}</BodyText>
        {subtitle ? <Caption as="p" className="ds-list-item-subtitle">{subtitle}</Caption> : null}
      </div>
      {trailing ? <div className="ds-list-item-trailing">{trailing}</div> : null}
    </li>
  );
}

export interface SettingsRowProps extends Omit<ListItemProps, "subtitle"> {
  hint?: ReactNode;
}

export function SettingsRow({ title, hint, leadingIcon, trailing, className = "", ...props }: SettingsRowProps) {
  return (
    <ListItem
      title={title}
      subtitle={hint}
      leadingIcon={leadingIcon}
      trailing={trailing}
      className={className}
      {...props}
    />
  );
}

export interface StatRowProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  value: ReactNode;
}

export function StatRow({ label, value, className = "", ...props }: StatRowProps) {
  return (
    <div className={`ds-list-item ${className}`.trim()} {...props}>
      <Caption as="span">{label}</Caption>
      <BodyText as="span" className="miniapp-tnum">{value}</BodyText>
    </div>
  );
}
