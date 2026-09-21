export default function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-label">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
