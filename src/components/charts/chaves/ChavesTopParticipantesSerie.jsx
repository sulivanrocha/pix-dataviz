import { useMemo } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "../../shared/ChartCard";
import { ChartTooltip } from "../../shared/ChartTooltip";
import { CsvDownloadButton } from "../../shared/CsvDownloadButton";
import { Filters } from "../../shared/Filters";
import {
  formatAnoMes,
  formatNumberCompact,
  formatNumberFull,
} from "../../../lib/format";

const LINE_COLORS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
  "var(--seq-500)",
  "var(--accent-secondary)",
];

// "2020-11" (YYYY-MM) -> 202011 (AAAAMM), para casar com o Filters
function mesToAnoMes(mes) {
  return Number(mes.replace("-", ""));
}

function Panel({ title, color, participantes, rows, colorFor }) {
  return (
    <section className="top-serie-panel">
      <h3 className="top-serie-panel__title" style={{ color }}>
        {title}
      </h3>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={rows}
          margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
        >
          <CartesianGrid stroke="var(--gridline)" vertical={false} />

          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
            interval={Math.max(Math.ceil(rows.length / 6) - 1, 0)}
          />

          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={formatNumberCompact}
          />

          <Tooltip
            cursor={{ stroke: "var(--gridline)", strokeWidth: 1 }}
            content={<ChartTooltip formatValue={formatNumberFull} />}
          />

          {participantes.map((nome) => (
            <Line
              key={nome}
              type="monotone"
              dataKey={nome}
              name={nome}
              stroke={colorFor(nome)}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              animationDuration={700}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <ul className="top-serie-legend">
        {participantes.map((nome) => (
          <li key={nome}>
            <span
              className="top-serie-legend__key"
              style={{ background: colorFor(nome) }}
            />
            <span className="top-serie-legend__label" title={nome}>
              {nome}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ChavesTopParticipantesSerie({
  topParticipantesSerie,
  months,
  start,
  end,
  onStartChange,
  onEndChange,
}) {
  const { meses, PF, PJ } = topParticipantesSerie;

  // Um mapa nome -> cor estável para cada painel (cores independentes,
  // já que os tops de PF e PJ podem ter participantes diferentes).
  const colorForPF = useMemo(() => {
    const map = new Map(PF.participantes.map((n, i) => [n, LINE_COLORS[i % LINE_COLORS.length]]));
    return (nome) => map.get(nome) ?? "var(--text-muted)";
  }, [PF.participantes]);

  const colorForPJ = useMemo(() => {
    const map = new Map(PJ.participantes.map((n, i) => [n, LINE_COLORS[i % LINE_COLORS.length]]));
    return (nome) => map.get(nome) ?? "var(--text-muted)";
  }, [PJ.participantes]);

  // Índices dos meses dentro do range selecionado.
  const visibleIndices = useMemo(
    () =>
      meses
        .map((mes, i) => ({ anoMes: mesToAnoMes(mes), i }))
        .filter(({ anoMes }) => anoMes >= start && anoMes <= end)
        .map(({ i }) => i),
    [meses, start, end]
  );

  const buildRows = (panel) =>
    visibleIndices.map((i) => {
      const row = { mes: formatAnoMes(mesToAnoMes(meses[i])) };
      for (const nome of panel.participantes) {
        row[nome] = panel.series[nome]?.[i] ?? 0;
      }
      return row;
    });

  const rowsPF = useMemo(() => buildRows(PF), [PF, visibleIndices, meses]);
  const rowsPJ = useMemo(() => buildRows(PJ), [PJ, visibleIndices, meses]);

  const exportRows = useMemo(() => {
    const out = [];
    for (const i of visibleIndices) {
      const mes = formatAnoMes(mesToAnoMes(meses[i]));
      for (const nome of PF.participantes) {
        out.push({ Tipo: "Pessoa física", Mês: mes, Participante: nome, Chaves: PF.series[nome]?.[i] ?? 0 });
      }
      for (const nome of PJ.participantes) {
        out.push({ Tipo: "Pessoa jurídica", Mês: mes, Participante: nome, Chaves: PJ.series[nome]?.[i] ?? 0 });
      }
    }
    return out;
  }, [visibleIndices, meses, PF, PJ]);

  return (
    <ChartCard
      title="Evolução das chaves por participante (Top 10)"
      subtitle="Série histórica dos 10 maiores participantes por tipo de usuário, ranqueados pelo estoque no último mês"
      fullWidth
      tabs={
        <div className="top-serie-controls">
          <Filters
            months={months}
            start={start}
            end={end}
            onStartChange={onStartChange}
            onEndChange={onEndChange}
          />

          <CsvDownloadButton
            data={exportRows}
            filename="chaves-top-participantes-serie.csv"
          />
        </div>
      }
    >
      <div className="top-serie-grid">
        <Panel
          title="Pessoa física"
          color="var(--series-1)"
          participantes={PF.participantes}
          rows={rowsPF}
          colorFor={colorForPF}
        />

        <Panel
          title="Pessoa jurídica"
          color="var(--series-2)"
          participantes={PJ.participantes}
          rows={rowsPJ}
          colorFor={colorForPJ}
        />
      </div>

      <p className="top-serie-axis-label">Número de chaves cadastradas</p>

      <style>
        {`
          .top-serie-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 28px;
            align-items: start;
          }

          .top-serie-panel {
            min-width: 0;
          }

          .top-serie-panel__title {
            margin: 0 0 12px;
            font-size: 14px;
            font-weight: 600;
          }

          .top-serie-legend {
            list-style: none;
            margin: 10px 0 0;
            padding: 0;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 4px 12px;
          }

          .top-serie-legend li {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
          }

          .top-serie-legend__key {
            width: 12px;
            height: 3px;
            border-radius: 2px;
            flex: none;
          }

          .top-serie-legend__label {
            font-size: 11px;
            color: var(--text-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .top-serie-axis-label {
            margin: 8px 0 0;
            text-align: center;
            color: var(--text-muted);
            font-size: 12px;
          }

          .top-serie-controls {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          @media (max-width: 1000px) {
            .top-serie-grid {
              grid-template-columns: 1fr;
              gap: 32px;
            }
          }
        `}
      </style>
    </ChartCard>
  );
}