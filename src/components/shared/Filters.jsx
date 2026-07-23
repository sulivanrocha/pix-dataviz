import { useMemo } from "react";
import { formatAnoMes } from "../../lib/format";

function yearOf(anoMes) {
  return Math.floor(anoMes / 100);
}

function monthOf(anoMes) {
  return anoMes % 100;
}

function monthLabel(anoMes) {
  // Reuses the existing formatAnoMes locale/format instead of
  // hardcoding month names, so it always matches the rest of the app.
  return formatAnoMes(anoMes).split("/")[0];
}

function CascadingMonthSelect({ label, value, options, onChange }) {
  const years = useMemo(
    () => [...new Set(options.map(yearOf))].sort((a, b) => a - b),
    [options]
  );

  const currentYear = yearOf(value);

  const monthsInYear = useMemo(
    () =>
      options
        .filter((m) => yearOf(m) === currentYear)
        .sort((a, b) => a - b),
    [options, currentYear]
  );

  function handleYearChange(newYear) {
    const optionsInNewYear = options
      .filter((m) => yearOf(m) === newYear)
      .sort((a, b) => a - b);

    if (optionsInNewYear.length === 0) return;

    // Keep the same month if it exists in the new year, otherwise
    // fall back to the closest available month.
    const sameMonth = optionsInNewYear.find(
      (m) => monthOf(m) === monthOf(value)
    );
    onChange(sameMonth ?? optionsInNewYear[0]);
  }

  return (
    <label className="filters-cascade">
      {label}
      <div className="filters-cascade-selects">
        <select
          value={currentYear}
          onChange={(e) => handleYearChange(Number(e.target.value))}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {monthsInYear.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

/**
 * Barra de filtros de periodo.
 *
 * `layout` controla como os seletores De/Ate se organizam:
 *   - "row"   (padrao) lado a lado. Melhor em barras de filtro
 *             de pagina inteira, onde sobra largura horizontal.
 *   - "stack" empilhado. Melhor dentro de um chart-card estreito
 *             ou ao lado de outro grupo vertical, como o
 *             MunicipioSelector.
 *
 * Abaixo de 560px o CSS empilha sempre, independente da prop.
 */
export function Filters({
  months,
  start,
  end,
  onStartChange,
  onEndChange,
  hint,
  layout = "row",
  children,
}) {
  const startOptions = months.filter((m) => m <= end);
  const endOptions = months.filter((m) => m >= start);

  const periodClass =
    layout === "stack"
      ? "filters-period is-stack"
      : "filters-period is-row";

  return (
    <div className="filters-row">
      <div className={periodClass}>
        <CascadingMonthSelect
          label="De"
          value={start}
          options={startOptions}
          onChange={onStartChange}
        />

        <CascadingMonthSelect
          label="Até"
          value={end}
          options={endOptions}
          onChange={onEndChange}
        />
      </div>

      {children}
      {hint && <span className="filters-hint">{hint}</span>}
    </div>
  );
}