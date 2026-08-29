function SummaryCard({ label, value, tone = '' }) {
  return <article className={`dashboard-summary-card ${tone}`}>
    <strong>{value}</strong>
    <span>{label}</span>
  </article>;
}

export default SummaryCard;
