export function StatTile({ label, value, delta }) {
  return (
    <div className="stat-tile">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {delta != null && (
        <p className={`stat-delta${delta >= 0 ? " positive" : ""}`}>
          {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}% vs. mês anterior
        </p>
      )}
    </div>
  );
}
