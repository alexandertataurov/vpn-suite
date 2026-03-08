import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

export interface SnapCarouselProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const SnapCarousel = forwardRef<HTMLDivElement, SnapCarouselProps>(function SnapCarousel(
  {
    children,
    className = "",
    ...props
  },
  ref,
) {
  return (
    <div ref={ref} className={`snap-carousel ${className}`.trim()} {...props}>
      {children}
    </div>
  );
});
