import "./BootstrapSkeleton.css";

export function BootstrapSkeleton() {
  return (
    <div className="boot-skeleton-card">
      <div className="boot-skeleton-row boot-skeleton-row--sm" />
      <div className="boot-skeleton-row boot-skeleton-row--lg" />
      <div className="boot-skeleton-row boot-skeleton-row--sm" />
      <div className="boot-skeleton-stats">
        <div className="boot-skeleton-stat" />
        <div className="boot-skeleton-stat" />
        <div className="boot-skeleton-stat" />
      </div>
    </div>
  );
}
