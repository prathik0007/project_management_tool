import { Icon } from './Icons.jsx';

// ─── Polished empty state with icon, message and optional action ────────────
export default function EmptyState({ icon = 'spark', title, message, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon"><Icon name={icon} size={26} /></span>
      <p className="empty-state-title">{title}</p>
      {message && <p className="muted">{message}</p>}
      {action}
    </div>
  );
}
