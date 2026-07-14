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

function toTitleCase(value = "") {
  return value.replace(/\S+/g, (word) => {
    return word[0] + word.slice(1).toLowerCase();
  });
}

/**
 * Retorna os campos que serão somados de acordo com:
 * - perspectiva: Pagador ou Recebedor
 * - segmento: Todos, PF ou PJ
 * - visão: valor, transações ou pessoas
 *
 * Para a visão "pessoas", os nomes dos campos devem ser informados
 * através da prop pessoasFields, pois eles dependem da estrutura da API.
 */
function getMetricFields({
  perspectiva,
  segmento,
  visao,
  pessoasFields,
}) {
  if (visao === "valor") {
    if (segmento === "Todos") {
      return [
        `VL_${perspectiva}PF`,
        `VL_${perspectiva}PJ`,
      ];
    }

    return [`VL_${perspectiva}${segmento}`];
  }

  if (visao === "transacoes") {
    if (segmento === "Todos") {
      return [
        `QT_${perspectiva}PF`,
        `QT_${perspectiva}PJ`,
      ];
    }

    return [`QT_${perspectiva}${segmento}`];
  }

  if (visao === "pessoas") {
    if (!pessoasFields) return [];

    if (segmento === "Todos") {
      return [
        pessoasFields?.[perspectiva]?.PF,
        pessoasFields?.[perspectiva]?.PJ,
      ].filter(Boolean);
    }

    return [
      pessoasFields?.[perspectiva]?.[segmento],
    ].filter(Boolean);
  }

  return [];
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

  link.href = url;
  link.download =
    `pix-top-estados-${visao}-${perspectivaSlug}-${start}-${end}.csv`;

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
   * Informe esta prop quando soubermos os nomes exatos
   * dos campos de pessoas na base.
   *
   * Exemplo:
   *
   * pessoasFields={{
   *   Pagador: {
   *     PF: "QT_PessoasPagadorPF",
   *     PJ: "QT_PessoasPagadorPJ",
   *   },
   *   Recebedor: {
   *     PF: "QT_PessoasRecebedorPF",
   *     PJ: "QT_PessoasRecebedorPJ",
   *   },
   * }}
   */
  pessoasFields = null,
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
        pessoasFields,
      }),
    [
      perspectiva,
      segmento,
      visao,
      pessoasFields,
    ]
  );

  const rows = useMemo(() => {
    /*
     * Evita mostrar valores incorretos na visão Pessoas
     * enquanto os campos específicos não forem configurados.
     */
    if (!metricFields.length) {
      return [];
    }

    const filtered = porEstadoMensal.filter(
      (row) => {
        const dentroDoPeriodo =
          row.AnoMes >= start &&
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
  ]);

  const perspectiveText =
    PERSPECTIVA_LABEL[perspectiva];

  const metricText =
    VISAO_LABEL[visao];

  const title = estadoIbge
    ? `${metricText} ${perspectiveText} no estado selecionado`
    : `Top ${TOP_N} estados por ${metricText} ${perspectiveText}`;

  const subtitle =
    visao === "pessoas" &&
    !metricFields.length
      ? "Os campos de pessoas ainda precisam ser configurados de acordo com a estrutura da base."
      : `${SEGMENTO_LABEL[segmento]}, perspectiva ${perspectiva.toLowerCase()}, no período filtrado.`;

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
      fullWidth
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
          {visao === "pessoas"
            ? "Configure os campos da visão Pessoas para exibir este gráfico."
            : "Não há dados para os filtros selecionados."}
        </div>
      )}
    </ChartCard>
  );
}