export function ChartCard({
  title,
  subtitle,
  actions,
  fullWidth,
  children,
}) {
  return (
    <section className={fullWidth ? "chart-card chart-card--full" : "chart-card"}>
      <div className="chart-card__header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>

        {actions && (
          <div className="chart-card__actions">
            {actions}
          </div>
        )}
      </div>

      {children}
    </section>
  );
}