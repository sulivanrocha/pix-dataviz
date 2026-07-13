// Tooltip compartilhado: título mudo, linha-chave (não caixa) por série,
// valor em destaque e nome secundário — ver dataviz skill / interaction.md.
export function ChartTooltip({ active, payload, label, formatValue = (v) => v }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="viz-tooltip">
      {label != null && <p className="tooltip-title">{label}</p>}
      {payload.map((entry) => (
        <div className="tooltip-row" key={entry.dataKey ?? entry.name}>
          <span className="tooltip-key" style={{ background: entry.color }} />
          <span className="tooltip-name">{entry.name}</span>
          <span className="tooltip-value">{formatValue(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}
