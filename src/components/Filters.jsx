import { formatAnoMes } from "../lib/format";

export function Filters({ months, start, end, onStartChange, onEndChange }) {
  return (
    <div className="filters-row">
      <label>
        De
        <select value={start} onChange={(e) => onStartChange(Number(e.target.value))}>
          {months
            .filter((m) => m <= end)
            .map((m) => (
              <option key={m} value={m}>
                {formatAnoMes(m)}
              </option>
            ))}
        </select>
      </label>
      <label>
        Até
        <select value={end} onChange={(e) => onEndChange(Number(e.target.value))}>
          {months
            .filter((m) => m >= start)
            .map((m) => (
              <option key={m} value={m}>
                {formatAnoMes(m)}
              </option>
            ))}
        </select>
      </label>
      <span className="filters-hint">
        Filtra os gráficos de transações, categorias e estados abaixo.
      </span>
    </div>
  );
}
