export function ChartCard({ title, subtitle, fullWidth = false, tabs, children }) {
  return (
    <div className={`chart-card${fullWidth ? " full-width" : ""}`}>
      <div className="chart-card-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {tabs}
      </div>
      {children}
    </div>
  );
}
