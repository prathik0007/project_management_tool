// ─── Skeleton loading placeholders (avoid layout jumps) ─────────────────────
export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <span className="skeleton-line title-line" />
      <span className="skeleton-line short-line" />
      <span className="skeleton-line bar-line" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="skeleton-row" aria-hidden="true">
      <span className="skeleton-avatar" />
      <div className="skeleton-content">
        <span className="skeleton-line bar-line" />
        <span className="skeleton-line short-line" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="skeleton-stat-card" aria-hidden="true">
      <span className="skeleton-line short-line" />
      <span className="skeleton-line stat-number" />
    </div>
  );
}

export default function Skeletons({ count = 3, type = 'card', rows = false }) {
  const isRow = rows || type === 'row';
  const isStat = type === 'stat';

  return (
    <div className={`skeleton-grid ${isRow ? 'skeleton-list-rows' : isStat ? 'skeleton-grid-stats' : 'skeleton-grid-cards'}`} role="status" aria-label="Loading content">
      {Array.from({ length: count }, (_, i) =>
        isRow ? <SkeletonRow key={i} /> : isStat ? <SkeletonStat key={i} /> : <SkeletonCard key={i} />
      )}
    </div>
  );
}
