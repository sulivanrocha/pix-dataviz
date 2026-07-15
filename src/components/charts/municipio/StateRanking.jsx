import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartCard } from "../../shared/ChartCard";
import { ChartTooltip } from "../../shared/ChartTooltip";
import {
  formatCurrencyCompact,
  formatCurrencyFull,
  formatNumberCompact,
} from "../../../lib/format";

const TOP_N = 10;

const PERSPECTIVA_LABEL = {
  Pagador: "pago",
  Recebedor: "recebido",
};

const SEGMENTO_LABEL = {
  Todos: "PF + PJ",
  PF: "pessoa física",
  PJ: "pessoa jurídica",
};

const VISAO_LABEL = {
  valor: "valor",
  transacoes: "transações",
  pessoas: "pessoas",
};

/**
 * Prefixo do campo de cada visão.
 *
 * VL_  -> volume financeiro
 * QT_  -> quantidade de transações
 * QT_PES_ -> quantidade de pessoas distintas no mês
 */
const VISAO_PREFIXO = {
  valor: "VL_",
  transacoes: "QT_",
  pessoas: "QT_PES_",
};

function toTitleCase(value = "") {
  return value.replace(/\S+/g, (word) => {
    return word[0] + word.slice(1).toLowerCase();
  });
}

/**
 * AAAAMM -> MM/AAAA.
 */
function formatMesReferencia(anoMes) {
  if (!anoMes) {
    return "";
  }

  const ano = Math.floor(anoMes / 100);
  const mes = String(anoMes % 100).padStart(2, "0");

  return `${mes}/${ano}`;
}

/**
 * Retorna os campos que serão somados de acordo com:
 * - perspectiva: Pagador ou Recebedor
 * - segmento: Todos, PF ou PJ
 * - visão: valor, transações ou pessoas
 */
function getMetricFields({ perspectiva, segmento, visao }) {
  const prefixo = VISAO_PREFIXO[visao];

  if (!prefixo) {
    return [];
  }

  if (segmento === "Todos") {
    return [
      `${prefixo}${perspectiva}PF`,
      `${prefixo}${perspectiva}PJ`,
    ];
  }

  return [`${prefixo}${perspectiva}${segmento}`];
}

function getMetricConfig(visao) {
  if (visao === "valor") {
    return {
      dataKey: "valor",
      seriesName: "Valor",
      axisFormatter: formatCurrencyCompact,
      tooltipFormatter: formatCurrencyFull,
    };
  }

  return {
    dataKey: "valor",
    seriesName:
      visao === "pessoas"
        ? "Pessoas"
        : "Transações",
    axisFormatter: formatNumberCompact,
    tooltipFormatter: formatNumberCompact,
  };
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function downloadCsv({
  rows,
  perspectiva,
  visao,
  start,
  end,
  mesReferencia,
}) {
  if (!rows.length) return;

  const header = [
    "Posição",
    "Estado",
    VISAO_LABEL[visao],
  ];

  const body = rows.map((row, index) => [
    index + 1,
    row.estado,
    row.valor,
  ]);

  const csv = [header, ...body]
    .map((row) =>
      row.map(escapeCsvValue).join(",")
    )
    .join("\n");

  const blob = new Blob(
    [`\uFEFF${csv}`],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const perspectivaSlug =
    perspectiva.toLowerCase();

  /*
   * Em Pessoas o recorte é um único mês, não um intervalo:
   * o nome do arquivo precisa refletir o que foi realmente calculado.
   */
  const periodoSlug =
    visao === "pessoas"
      ? `${mesReferencia}`
      : `${start}-${end}`;

  link.href = url;
  link.download =
    `pix-top-estados-${visao}-${perspectivaSlug}-${periodoSlug}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function StateRanking({
  porEstadoMensal,
  start,
  end,
  regiao = "Todas",
  estadoIbge = "",
  perspectiva = "Pagador",
  segmento = "Todos",
  visao = "valor",

  /**
   * Quando o card divide a linha com outro gráfico
   * (ex.: ranking de municípios), deixe como false.
   */
  fullWidth = false,
}) {
  const metricConfig = useMemo(
    () => getMetricConfig(visao),
    [visao]
  );

  const metricFields = useMemo(
    () =>
      getMetricFields({
        perspectiva,
        segmento,
        visao,
      }),
    [perspectiva, segmento, visao]
  );

  /**
   * Mês de referência da visão Pessoas: o último mês com dados dentro do
   * intervalo filtrado.
   *
   * QT_PES_* conta pessoas distintas em um mês; somar meses contaria a mesma
   * pessoa várias vezes. Por isso o ranking de Pessoas é um retrato de um mês
   * — o início do intervalo não o afeta.
   */
  const mesReferencia = useMemo(() => {
    if (visao !== "pessoas") {
      return null;
    }

    const meses = porEstadoMensal
      .map((row) => Number(row.AnoMes))
      .filter(
        (anoMes) =>
          Number.isFinite(anoMes) &&
          anoMes >= start &&
          anoMes <= end
      );

    return meses.length > 0
      ? Math.max(...meses)
      : null;
  }, [porEstadoMensal, start, end, visao]);

  const rows = useMemo(() => {
    if (!metricFields.length) {
      return [];
    }

    if (visao === "pessoas" && mesReferencia === null) {
      return [];
    }

    const filtered = porEstadoMensal.filter(
      (row) => {
        /*
         * Valor e Transações acumulam o intervalo inteiro.
         * Pessoas usa somente o mês de referência.
         */
        const dentroDoPeriodo =
          visao === "pessoas"
            ? Number(row.AnoMes) === mesReferencia
            : row.AnoMes >= start &&
              row.AnoMes <= end;

        const dentroDaRegiao =
          regiao === "Todas" ||
          row.Regiao === regiao;

        const estadoSelecionado =
          !estadoIbge ||
          String(row.Estado_Ibge) ===
            String(estadoIbge);

        return (
          dentroDoPeriodo &&
          dentroDaRegiao &&
          estadoSelecionado
        );
      }
    );

    const byState = new Map();

    for (const row of filtered) {
      const metricValue = metricFields.reduce(
        (sum, field) => {
          return (
            sum +
            (Number(row[field]) || 0)
          );
        },
        0
      );

      const stateKey =
        row.Estado_Ibge ?? row.Estado;

      const current =
        byState.get(stateKey) ?? {
          estadoIbge: row.Estado_Ibge,
          estado: toTitleCase(row.Estado),
          valor: 0,
        };

      current.valor += metricValue;

      byState.set(stateKey, current);
    }

    return [...byState.values()]
      .sort((a, b) => b.valor - a.valor)
      .slice(0, TOP_N);
  }, [
    porEstadoMensal,
    start,
    end,
    regiao,
    estadoIbge,
    metricFields,
    visao,
    mesReferencia,
  ]);

  const perspectiveText =
    PERSPECTIVA_LABEL[perspectiva];

  const metricText =
    VISAO_LABEL[visao];

  const mesReferenciaLabel =
    formatMesReferencia(mesReferencia);

  const title = estadoIbge
    ? `${metricText} ${perspectiveText} no estado selecionado`
    : `Top ${TOP_N} estados por ${metricText} ${perspectiveText}`;

  const escopoNacional =
    (!regiao || regiao === "Todas") &&
    !estadoIbge;

  const escopoTexto = escopoNacional
    ? " Brasil inteiro — não é afetado pelos filtros de região, estado e município."
    : "";

  const subtitle =
    visao === "pessoas"
      ? `${SEGMENTO_LABEL[segmento]}, perspectiva ${perspectiva.toLowerCase()}. Pessoas distintas em ${
          mesReferenciaLabel || "—"
        }, último mês do intervalo — contagens mensais não se somam ao longo do período.${escopoTexto}`
      : `${SEGMENTO_LABEL[segmento]}, perspectiva ${perspectiva.toLowerCase()}, no período filtrado.${escopoTexto}`;

  const actions = (
    <button
      type="button"
      className="download-csv-button"
      disabled={!rows.length}
      onClick={() =>
        downloadCsv({
          rows,
          perspectiva,
          visao,
          start,
          end,
          mesReferencia,
        })
      }
    >
      Baixar CSV
    </button>
  );

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      fullWidth={fullWidth}
      tabs={actions}
    >
      {rows.length > 0 ? (
        <ResponsiveContainer
          width="100%"
          height={360}
        >
          <BarChart
            data={rows}
            layout="vertical"
            margin={{
              top: 8,
              right: 24,
              left: 8,
              bottom: 0,
            }}
          >
            <CartesianGrid
              stroke="var(--gridline)"
              horizontal={false}
            />

            <XAxis
              type="number"
              tick={{
                fontSize: 11,
                fill: "var(--text-muted)",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={
                metricConfig.axisFormatter
              }
            />

            <YAxis
              type="category"
              dataKey="estado"
              tick={{
                fontSize: 12,
                fill: "var(--text-secondary)",
              }}
              axisLine={{
                stroke: "var(--baseline)",
              }}
              tickLine={false}
              width={140}
            />

            <Tooltip
              cursor={{
                fill: "var(--gridline)",
                opacity: 0.4,
              }}
              content={
                <ChartTooltip
                  formatValue={
                    metricConfig.tooltipFormatter
                  }
                />
              }
            />

            <Bar
              dataKey={metricConfig.dataKey}
              name={metricConfig.seriesName}
              radius={[0, 4, 4, 0]}
            >
              {rows.map((row) => (
                <Cell
                  key={
                    row.estadoIbge ??
                    row.estado
                  }
                  fill="var(--series-1)"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="state-message">
          Não há dados para os filtros selecionados.
        </div>
      )}
    </ChartCard>
  );
}