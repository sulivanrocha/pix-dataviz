import { useMemo, useState } from "react";
import { Filters } from "../components/shared/Filters";
import { StatTile } from "../components/shared/StatTile";
import { StateRanking } from "../components/charts/municipio/StateRanking";
import { RegiaoSummaryChart } from "../components/charts/municipio/RegiaoSummaryChart";
import { MunicipioSelector } from "../components/MunicipioSelector";
import {
  formatCurrencyCompact,
  formatCurrencyFull,
  formatNumberCompact,
} from "../lib/format";

const PERSPECTIVAS = [
  { value: "Pagador", label: "Pagador" },
  { value: "Recebedor", label: "Recebedor" },
];

const VISOES = [
  { value: "valor", label: "Valor (R$)" },
  { value: "transacoes", label: "Transações" },
  { value: "pessoas", label: "Pessoas" },
];

const VISAO_LABEL = {
  valor: "Valor",
  transacoes: "Transações",
  pessoas: "Pessoas",
};

const SEGMENTOS = [
  { value: "Todos", label: "PF + PJ" },
  { value: "PF", label: "Pessoa Física" },
  { value: "PJ", label: "Pessoa Jurídica" },
];

const PERSPECTIVA_LABEL = {
  Pagador: "pago",
  Recebedor: "recebido",
};

/**
 * Retorna os campos usados em cada visão.
 *
 * A visão Pessoas depende dos nomes reais das colunas da base.
 * Enquanto esses campos não forem confirmados, ela retorna um array vazio
 * para evitar apresentar transações como se fossem usuários únicos.
 */
function getMetricFields(visao, perspectiva, segmento) {
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

/**
 * Soma os campos informados dentro de um registro.
 */
function sumFields(row, fields) {
  return fields.reduce(
    (total, field) => total + (Number(row?.[field]) || 0),
    0
  );
}

/**
 * Converte um valor selecionado no componente Filters para número.
 * Alguns componentes select retornam strings, enquanto AnoMes é numérico.
 */
function normalizeMonth(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  return Number.isNaN(numericValue)
    ? null
    : numericValue;
}

export function TransacoesMunicipioPage({ municipio }) {
  /**
   * Último mês permitido na página.
   *
   * Exemplo:
   * se a data atual estiver em julho, o último mês mostrado será junho.
   */
  const ultimoMesCompleto = useMemo(() => {
    const hoje = new Date();

    const mesAnterior = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      0
    );

    return (
      mesAnterior.getFullYear() * 100 +
      (mesAnterior.getMonth() + 1)
    );
  }, []);

  /**
   * Lista de meses disponível para os filtros.
   * O mês corrente é removido mesmo que já exista na base.
   */
  const months = useMemo(() => {
    const rows = municipio?.porEstadoMensal ?? [];

    return [
      ...new Set(
        rows
          .map((row) => Number(row.AnoMes))
          .filter(
            (anoMes) =>
              Number.isFinite(anoMes) &&
              anoMes <= ultimoMesCompleto
          )
      ),
    ].sort((a, b) => a - b);
  }, [
    municipio?.porEstadoMensal,
    ultimoMesCompleto,
  ]);

  /**
   * Todos os filtros da página ficam em um único objeto.
   * Esses valores controlam cards e gráficos.
   */
  const [filtros, setFiltros] = useState({
    start: null,
    end: null,
    regiao: "Todas",
    estadoIbge: "",
    municipio: null,
    perspectiva: "Pagador",
    visao: "valor",
    segmento: "Todos",
    dadosEstado: [],
  });

  /**
   * Período efetivo.
   *
   * Quando o usuário ainda não escolheu datas:
   * - início = primeiro mês disponível;
   * - fim = último mês completo disponível.
   */
  const range = useMemo(() => {
    const firstMonth = months[0] ?? null;
    const lastMonth =
      months[months.length - 1] ?? null;

    return {
      start:
        normalizeMonth(filtros.start) ??
        firstMonth,
      end:
        normalizeMonth(filtros.end) ??
        lastMonth,
    };
  }, [
    filtros.start,
    filtros.end,
    months,
  ]);

  /**
   * Dados mensais do município selecionado.
   *
   * dadosEstado é carregado pelo MunicipioSelector.
   */
  const serieMunicipio = useMemo(() => {
    if (!filtros.municipio) {
      return [];
    }

    const municipioIbge = String(
      filtros.municipio.ibge
    );

    return (filtros.dadosEstado ?? [])
      .filter(
        (row) =>
          String(row.Municipio_Ibge) ===
            municipioIbge &&
          Number(row.AnoMes) <=
            ultimoMesCompleto
      )
      .sort(
        (a, b) =>
          Number(a.AnoMes) -
          Number(b.AnoMes)
      );
  }, [
    filtros.municipio,
    filtros.dadosEstado,
    ultimoMesCompleto,
  ]);

  /**
   * Base geográfica aplicada aos cards.
   *
   * Hierarquia:
   * município > estado > região > Brasil.
   */
  const dadosFiltrados = useMemo(() => {
    const metricRows =
      filtros.municipio &&
      serieMunicipio.length > 0
        ? serieMunicipio
        : municipio?.porEstadoMensal ?? [];

    return metricRows.filter((row) => {
      const anoMes = Number(row.AnoMes);

      if (
        range.start !== null &&
        anoMes < range.start
      ) {
        return false;
      }

      if (
        range.end !== null &&
        anoMes > range.end
      ) {
        return false;
      }

      if (anoMes > ultimoMesCompleto) {
        return false;
      }

      /*
       * No nível municipal, serieMunicipio já contém
       * somente o município escolhido.
       */
      if (filtros.municipio) {
        return true;
      }

      if (filtros.estadoIbge) {
        return (
          String(row.Estado_Ibge) ===
          String(filtros.estadoIbge)
        );
      }

      if (
        filtros.regiao &&
        filtros.regiao !== "Todas"
      ) {
        return row.Regiao === filtros.regiao;
      }

      return true;
    });
  }, [
    municipio?.porEstadoMensal,
    filtros.regiao,
    filtros.estadoIbge,
    filtros.municipio,
    serieMunicipio,
    range.start,
    range.end,
    ultimoMesCompleto,
  ]);

  /**
   * Calcula os cards usando exatamente os mesmos filtros
   * aplicados aos gráficos.
   */
  const totals = useMemo(() => {
    const valorFields = getMetricFields(
      "valor",
      filtros.perspectiva,
      filtros.segmento
    );

    const transactionFields = getMetricFields(
      "transacoes",
      filtros.perspectiva,
      filtros.segmento
    );

    const byMonth = new Set();

    const result = dadosFiltrados.reduce(
      (accumulator, row) => {
        accumulator.valor += sumFields(
          row,
          valorFields
        );

        accumulator.transacoes += sumFields(
          row,
          transactionFields
        );

        byMonth.add(Number(row.AnoMes));

        return accumulator;
      },
      {
        valor: 0,
        transacoes: 0,
      }
    );

    return {
      ...result,
      meses: byMonth.size,
    };
  }, [
    dadosFiltrados,
    filtros.perspectiva,
    filtros.segmento,
  ]);

  /**
   * Valor principal exibido no primeiro card,
   * de acordo com a visão selecionada.
   */
  const totalVisao = useMemo(() => {
    if (filtros.visao === "valor") {
      return formatCurrencyCompact(
        totals.valor
      );
    }

    if (filtros.visao === "transacoes") {
      return formatNumberCompact(
        totals.transacoes
      );
    }

    return "—";
  }, [
    filtros.visao,
    totals.valor,
    totals.transacoes,
  ]);

  /**
   * Média mensal da métrica selecionada.
   */
  const mediaMensal = useMemo(() => {
    if (totals.meses === 0) {
      return "—";
    }

    if (filtros.visao === "valor") {
      return formatCurrencyCompact(
        totals.valor / totals.meses
      );
    }

    if (filtros.visao === "transacoes") {
      return formatNumberCompact(
        totals.transacoes / totals.meses
      );
    }

    return "—";
  }, [
    filtros.visao,
    totals.valor,
    totals.transacoes,
    totals.meses,
  ]);

  const ticketMedio =
    totals.transacoes > 0
      ? formatCurrencyFull(
          totals.valor / totals.transacoes
        )
      : "—";

  const perspectivaLabel =
    PERSPECTIVA_LABEL[
      filtros.perspectiva
    ] ?? "";

  const visaoLabel =
    VISAO_LABEL[filtros.visao] ??
    "Métrica";

  return (
    <>
      <Filters
        months={months}
        start={range.start}
        end={range.end}
        onStartChange={(value) =>
          setFiltros((current) => ({
            ...current,
            start: normalizeMonth(value),
          }))
        }
        onEndChange={(value) =>
          setFiltros((current) => ({
            ...current,
            end: normalizeMonth(value),
          }))
        }
        hint="Todos os filtros afetam os cards e gráficos da página."
      >
        {/*
          O MunicipioSelector controla a seleção
          encadeada de região, estado e município.

          Ele permanece dentro do bloco global de filtros,
          acima dos cards.
        */}
        <MunicipioSelector
          onChange={(selection) =>
            setFiltros((current) => ({
              ...current,
              regiao:
                selection.regiao ||
                current.regiao ||
                "Todas",
              estadoIbge:
                selection.estadoIbge || "",
              municipio:
                selection.municipio || null,
              dadosEstado:
                selection.dadosEstado || [],
            }))
          }
        />

        <label>
          Perspectiva
          <select
            value={filtros.perspectiva}
            onChange={(event) =>
              setFiltros((current) => ({
                ...current,
                perspectiva:
                  event.target.value,
              }))
            }
          >
            {PERSPECTIVAS.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Visão
          <select
            value={filtros.visao}
            onChange={(event) =>
              setFiltros((current) => ({
                ...current,
                visao:
                  event.target.value,
              }))
            }
          >
            {VISOES.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Segmento
          <select
            value={filtros.segmento}
            onChange={(event) =>
              setFiltros((current) => ({
                ...current,
                segmento:
                  event.target.value,
              }))
            }
          >
            {SEGMENTOS.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </Filters>

      <section className="kpi-row">
        <StatTile
          label={`${visaoLabel} ${perspectivaLabel} no período`}
          value={totalVisao}
        />

        <StatTile
          label={`${visaoLabel} médio mensal`}
          value={mediaMensal}
        />

        <StatTile
          label="Ticket médio"
          value={ticketMedio}
        />
      </section>

      <section className="charts-grid">
        <StateRanking
          porEstadoMensal={
            municipio?.porEstadoMensal ?? []
          }
          start={range.start}
          end={range.end}
          regiao={filtros.regiao}
          estadoIbge={filtros.estadoIbge}
          perspectiva={filtros.perspectiva}
          segmento={filtros.segmento}
          visao={filtros.visao}
          topN={10}
          showCsvDownload
        />
      </section>

      <section className="charts-grid">
        <RegiaoSummaryChart
          porEstadoMensal={
            municipio?.porEstadoMensal ?? []
          }
          start={range.start}
          end={range.end}
          regiao={filtros.regiao}
          estadoIbge={filtros.estadoIbge}
          segmento={filtros.segmento}
          municipio={filtros.municipio}
          serieMunicipio={serieMunicipio}
          perspectiva={filtros.perspectiva}
          visao={filtros.visao}
          ultimoMesCompleto={
            ultimoMesCompleto
          }
          showCsvDownload
        />
      </section>

      {filtros.visao === "pessoas" && (
        <div className="state-message">
          A visão Pessoas precisa ser conectada
          aos campos de usuários únicos disponíveis
          na base. Os campos QT representam
          transações e não devem ser utilizados
          como quantidade de pessoas.
        </div>
      )}
    </>
  );
}