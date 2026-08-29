// ─── Skeleton loading placeholders (avoid layout jumps) ─────────────────────
export function SkeletonCard() {
  return <div className="skeleton-card" aria-hidden="true"><span /><span className="short" /><span className="bar" /></div>;
}

export function SkeletonRow() {
  return <div className="skeleton-row" aria-hidden="true"><span className="bar" /><span className="short" /></div>;
}

export default function Skeletons({ count = 3, rows = false }) {
  return (
    <div className="skeleton-list" role="status" aria-label="Loading content">
      {Array.from({ length: count }, (_, i) => (rows ? <SkeletonRow key={i} /> : <SkeletonCard key={i} />))}
    </div>
  );
}
