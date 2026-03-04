import type { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return <table className={`table ${className}`.trim()}>{children}</table>;
}

export function TableHead({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <thead className={className}>{children}</thead>;
}

export function TableBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tr className={className}>{children}</tr>;
}

export function TableCell({
  children,
  className = "",
  header,
}: { children: ReactNode; className?: string; header?: boolean }) {
  const Tag = header ? "th" : "td";
  return <Tag className={className}>{children}</Tag>;
}
