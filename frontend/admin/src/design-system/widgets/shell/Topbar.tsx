import type { ButtonHTMLAttributes, ReactNode } from "react";

interface TopbarRootProps {
  children: ReactNode;
}

export function TopbarRoot({ children }: TopbarRootProps) {
  return <header className="topbar">{children}</header>;
}

interface TopbarBrandProps {
  wordmark: string;
  product: string;
}

export function TopbarBrand({ wordmark, product }: TopbarBrandProps) {
  return (
    <div className="tb-brand">
      {wordmark}
      <em>/</em>
      {product}
    </div>
  );
}

interface TopbarCrumbProps {
  segment: string;
  page: string;
}

export function TopbarCrumb({ segment, page }: TopbarCrumbProps) {
  return (
    <div className="tb-crumb">
      {segment} › <b>{page}</b>
    </div>
  );
}

interface TopbarRightProps {
  children: ReactNode;
}

export function TopbarRight({ children }: TopbarRightProps) {
  return <div className="tb-right">{children}</div>;
}

interface TopbarTimeProps {
  children: ReactNode;
  id?: string;
}

export function TopbarTime({ children, id }: TopbarTimeProps) {
  return (
    <span className="tb-time" id={id} aria-label="Current time">
      {children}
    </span>
  );
}

export function TopbarLiveChip() {
  return (
    <div className="live-chip" aria-label="Live status">
      <div className="ring pulse" />
      Live
    </div>
  );
}

interface TopbarBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function TopbarBtn({ children, className, ...props }: TopbarBtnProps) {
  return (
    <button type="button" className={`tb-btn${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </button>
  );
}

interface TopbarAvatarProps {
  initials: string;
}

export function TopbarAvatar({ initials }: TopbarAvatarProps) {
  return (
    <div className="tb-avatar" aria-hidden>
      {initials}
    </div>
  );
}
