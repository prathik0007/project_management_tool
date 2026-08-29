import { Icon } from './Icons.jsx';

// Tone → icon + CSS tone class for the dashboard stat cards
const TONES = {
  neutral: { icon: 'layers' },
  success: { icon: 'check' },
  warning: { icon: 'clock' },
  danger: { icon: 'alert' },
  info: { icon: 'dashboard' },
};

function SummaryCard({ label, value, tone = 'neutral', icon }) {
  const toneIcon = TONES[tone]?.icon || 'layers';
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span className="stat-card-icon"><Icon name={icon || toneIcon} size={18} /></span>
      <div className="stat-card-body">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

export default SummaryCard;
