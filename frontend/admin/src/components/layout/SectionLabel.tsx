import { Heading } from "@/design-system";

/** Renders the "HEALTH & STATUS ─────────────" section label pattern */

export function SectionLabel({
  children,
  id,
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <Heading
      level={2}
      id={id}
      className={`section-label operator-dashboard__section-label ${className}`.trim()}
    >
      {children}
    </Heading>
  );
}
