import { Icon } from './Icons.jsx';

const TONES = {
  neutral: { icon: 'layers', badgeClass: 'stat-badge-neutral' },
  success: { icon: 'check', badgeClass: 'stat-badge-success' },
  warning: { icon: 'clock', badgeClass: 'stat-badge-warning' },
  danger: { icon: 'alert', badgeClass: 'stat-badge-danger' },
  info: { icon: 'dashboard', badgeClass: 'stat-badge-info' },
};

function SummaryCard({ label, value, tone = 'neutral', icon, subtitle }) {
  const config = TONES[tone] || TONES.neutral;
  const iconName = icon || config.icon;

  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <span className={`stat-card-icon-box ${config.badgeClass}`}>
          <Icon name={iconName} size={18} />
        </span>
      </div>
      <div className="stat-card-value">{value}</div>
      {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
    </article>
  );
}

export default SummaryCard;
