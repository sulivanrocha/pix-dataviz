import { useEffect, useMemo, useState } from "react";
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
 * A visão Pessoas ainda não está disponível: os campos QT_PES contam
 * pessoas distintas por mês e não podem ser somados ao longo do período,
 * então retornamos vazio até definirmos uma agregação correta.
 */
function getMetricFields({ perspectiva, segmento, visao }) {
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
    "Município",
    "UF",
    VISAO_LABEL[visao],
  ];

  const body = rows.map((row, index) => [
    index + 1,
    row.nome,
    row.uf,
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
    `pix-top-municipios-${visao}-${perspectivaSlug}-${start}-${end}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/**
 * Ranking nacional de municípios.
 *
 * Consome public/data/municipios-top.json, gerado pelo ETL
 * (scripts/fetch-data.mjs) com as séries mensais completas dos
 * municípios candidatos a top 10 sob qualquer combinação de filtros.
 *
 * Este gráfico é sempre Brasil inteiro: os filtros de região, estado
 * e município da página não o afetam de propósito.
 */
export function MunicipioRanking({
  start,
  end,
  perspectiva = "Pagador",
  segmento = "Todos",
  visao = "valor",
}) {
  const [dataset, setDataset] = useState({
    status: "loading",
    municipios: [],
  });

  useEffect(() => {
    let cancelled = false;

    fetch("/data/municipios-top.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `Falha ao carregar municipios-top.json: HTTP ${res.status}`
          );
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        setDataset({
          status: "ready",
          municipios: json.municipios ?? [],
        });
      })
      .catch(() => {
        if (cancelled) return;
        setDataset({
          status: "error",
          municipios: [],
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const rows = useMemo(() => {
    /*
     * Evita mostrar valores incorretos na visão Pessoas
     * enquanto os campos específicos não forem configurados.
     */
    if (
      !metricFields.length ||
      dataset.status !== "ready"
    ) {
      return [];
    }

    return dataset.municipios
      .map((municipio) => {
        const valor = (municipio.serie ?? [])
          .filter((mes) => {
            const anoMes = Number(mes.AnoMes);

            return (
              anoMes >= start &&
              anoMes <= end
            );
          })
          .reduce((total, mes) => {
            return (
              total +
              metricFields.reduce(
                (sum, field) =>
                  sum +
                  (Number(mes[field]) || 0),
                0
              )
            );
          }, 0);

        return {
          ibge: municipio.ibge,
          nome: toTitleCase(municipio.nome),
          uf: municipio.uf,
          municipio: `${toTitleCase(municipio.nome)}, ${municipio.uf}`,
          valor,
        };
      })
      .filter((row) => row.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, TOP_N);
  }, [
    dataset,
    metricFields,
    start,
    end,
  ]);

  const perspectiveText =
    PERSPECTIVA_LABEL[perspectiva];

  const metricText =
    VISAO_LABEL[visao];

  const title =
    `Top ${TOP_N} municípios por ${metricText} ${perspectiveText}`;

  const subtitle =
    visao === "pessoas" &&
    !metricFields.length
      ? "Os campos de pessoas ainda precisam ser configurados de acordo com a estrutura da base."
      : `${SEGMENTO_LABEL[segmento]}, perspectiva ${perspectiva.toLowerCase()}, no período filtrado. Brasil inteiro — não é afetado pelos filtros de região, estado e município.`;

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

  let content;

  if (dataset.status === "loading") {
    content = (
      <div className="state-message">
        Carregando ranking de municípios...
      </div>
    );
  } else if (dataset.status === "error") {
    /*
     * Render guard: o arquivo municipios-top.json só existe após
     * reexecutar o ETL (node scripts/fetch-data.mjs).
     */
    content = (
      <div className="state-message">
        Dados nacionais de municípios ainda não
        gerados. Execute node scripts/fetch-data.mjs
        para criar public/data/municipios-top.json.
      </div>
    );
  } else if (rows.length === 0) {
    content = (
      <div className="state-message">
        {visao === "pessoas"
          ? "Configure os campos da visão Pessoas para exibir este gráfico."
          : "Não há dados para os filtros selecionados."}
      </div>
    );
  } else {
    content = (
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
            dataKey="municipio"
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
                key={row.ibge}
                fill="var(--series-2)"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      tabs={actions}
    >
      {content}
    </ChartCard>
  );
}