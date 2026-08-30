import { Icon } from './Icons.jsx';

// ─── Polished empty state with icon, message and optional action ────────────
export default function EmptyState({ icon = 'spark', title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon-container">
        <Icon name={icon} size={28} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
