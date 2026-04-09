import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface StorySectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function StorySection({
  title,
  description,
  children,
  className = "",
}: StorySectionProps) {
  return (
    <section className={cn("story-section", className)}>
      <div className="story-section__header">
        <h2 className="story-section__title">{title}</h2>
        {description ? <p className="story-section__desc">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export interface StoryShowcaseProps {
  children: ReactNode;
  className?: string;
}

export function StoryShowcase({ children, className = "" }: StoryShowcaseProps) {
  return <div className={cn("story-showcase", className)}>{children}</div>;
}

export interface StoryGridProps {
  children: ReactNode;
  className?: string;
}

export function StoryGrid({ children, className = "" }: StoryGridProps) {
  return <div className={cn("story-grid", className)}>{children}</div>;
}

export interface StoryStackProps {
  children: ReactNode;
  className?: string;
}

export function StoryStack({ children, className = "" }: StoryStackProps) {
  return <div className={cn("story-stack", className)}>{children}</div>;
}

export interface StoryComparisonProps {
  leftLabel?: string;
  rightLabel?: string;
  left: ReactNode;
  right: ReactNode;
  className?: string;
}

export function StoryComparison({
  leftLabel = "Do",
  rightLabel = "Don't",
  left,
  right,
  className = "",
}: StoryComparisonProps) {
  return (
    <div className={cn("story-comparison", className)}>
      <div className="story-comparison__column">
        <span className="story-comparison__label story-comparison__label--do">
          {leftLabel}
        </span>
        <div className="story-comparison__content">{left}</div>
      </div>
      <div className="story-comparison__column">
        <span className="story-comparison__label story-comparison__label--dont">
          {rightLabel}
        </span>
        <div className="story-comparison__content">{right}</div>
      </div>
    </div>
  );
}

export interface StoryPreviewCardProps {
  children: ReactNode;
  className?: string;
}

export function StoryPreviewCard({ children, className = "" }: StoryPreviewCardProps) {
  return <div className={cn("story-preview-card", className)}>{children}</div>;
}
