import type { HTMLAttributes } from "react";

export function Divider({ className = "", ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={`ds-divider ${className}`.trim()} {...props} />;
}
