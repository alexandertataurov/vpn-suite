import type { SVGProps } from "react";

export type IconTelegramStarProps = SVGProps<SVGSVGElement>;

export function IconTelegramStar({ className, ...props }: IconTelegramStarProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M12 2.5l2.58 5.23 5.77.84-4.18 4.07.99 5.76L12 15.68 6.84 18.4l.99-5.76L3.65 8.57l5.77-.84L12 2.5z"
        fill="currentColor"
      />
    </svg>
  );
}
