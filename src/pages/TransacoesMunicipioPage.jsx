import { useMemo, useState } from "react";
import { Filters } from "../components/shared/Filters";
import { StatTile } from "../components/shared/StatTile";
import { StateRanking } from "../components/charts/municipio/StateRanking";
import { MunicipioRanking } from "../components/charts/municipio/MunicipioRanking";
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

/**
 * Retorna os campos usados em cada visão.
 *
 * QT_PES_* conta pessoas distintas dentro de um mês. Como o BCB aloca cada
 * pessoa ao município do seu domicílio bancário, ela aparece em um único
 * município por mês — os campos são somáveis entre municípios, estados e
 * regiões, e PF + PJ são cadastros distintos. O que nunca vale é somar entre
 * meses: a mesma pessoa reaparece mês a mês. Por isso a visão Pessoas trabalha
 * sempre com um mês de referência.
 */
function getMetricFields(visao, perspectiva, segmento) {
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
   *
   * Valor e Transações acumulam no período. Pessoas é agregado por mês
   * (somando as geografias dentro do recorte) e nunca entre meses — daí
   * pessoasPorMes, de onde saem o mês de referência e a média mensal.
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

    const pessoasFields = getMetricFields(
      "pessoas",
      filtros.perspectiva,
      filtros.segmento
    );

    const pessoasPorMesMap = new Map();

    const result = dadosFiltrados.reduce(
      (accumulator, row) => {
        const anoMes = Number(row.AnoMes);

        accumulator.valor += sumFields(
          row,
          valorFields
        );

        accumulator.transacoes += sumFields(
          row,
          transactionFields
        );

        pessoasPorMesMap.set(
          anoMes,
          (pessoasPorMesMap.get(anoMes) ?? 0) +
            sumFields(row, pessoasFields)
        );

        return accumulator;
      },
      {
        valor: 0,
        transacoes: 0,
      }
    );

    const pessoasPorMes = [
      ...pessoasPorMesMap.entries(),
    ]
      .map(([anoMes, pessoas]) => ({
        anoMes,
        pessoas,
      }))
      .sort((a, b) => a.anoMes - b.anoMes);

    const pessoasUltimoMes =
      pessoasPorMes.length > 0
        ? pessoasPorMes[pessoasPorMes.length - 1]
        : null;

    const pessoasMediaMensal =
      pessoasPorMes.length > 0
        ? pessoasPorMes.reduce(
            (total, item) => total + item.pessoas,
            0
          ) / pessoasPorMes.length
        : null;

    return {
      ...result,
      meses: pessoasPorMes.length,
      pessoasUltimoMes,
      pessoasMediaMensal,
    };
  }, [
    dadosFiltrados,
    filtros.perspectiva,
    filtros.segmento,
  ]);

  /**
   * Mês de referência da visão Pessoas: o último mês do intervalo filtrado.
   */
  const mesReferenciaLabel = useMemo(
    () =>
      formatMesReferencia(
        totals.pessoasUltimoMes?.anoMes
      ),
    [totals.pessoasUltimoMes]
  );

  /**
   * Valor principal exibido no primeiro card,
   * de acordo com a visão selecionada.
   *
   * Em Pessoas não existe "total do período": exibimos o último mês do
   * intervalo, porque somar meses contaria a mesma pessoa várias vezes.
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

    if (filtros.visao === "pessoas") {
      return totals.pessoasUltimoMes
        ? formatNumberCompact(
            totals.pessoasUltimoMes.pessoas
          )
        : "—";
    }

    return "—";
  }, [
    filtros.visao,
    totals.valor,
    totals.transacoes,
    totals.pessoasUltimoMes,
  ]);

  /**
   * Média mensal da métrica selecionada.
   *
   * Em Pessoas é a média das contagens mensais — não o total dividido pelos
   * meses, que exigiria um total que não existe.
   */
  const mediaMensal = useMemo(() => {
    if (filtros.visao === "pessoas") {
      return totals.pessoasMediaMensal !== null
        ? formatNumberCompact(
            totals.pessoasMediaMensal
          )
        : "—";
    }

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
    totals.pessoasMediaMensal,
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

  /**
   * Rótulo do primeiro card. Em Pessoas ele deixa explícito que o número
   * é de um mês específico, não do período inteiro.
   */
  const totalLabel =
    filtros.visao === "pessoas"
      ? `Pessoas — ${perspectivaLabel}${
          mesReferenciaLabel
            ? ` em ${mesReferenciaLabel}`
            : ""
        }`
      : `${visaoLabel} ${perspectivaLabel} no período`;

  return (
    <>



    <Filters
        months={months}
        start={range.start}
        end={range.end}
        layout="stack"
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

      {filtros.visao === "pessoas" && (
        <div className="state-message">
          Pessoas conta usuários distintos em cada mês, alocados ao município
          do domicílio bancário. As contagens não se acumulam ao longo do
          tempo: o card principal e os rankings usam o último mês do intervalo
          como referência.
        </div>
      )}

      <section className="kpi-row">
        <StatTile
          label={totalLabel}
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

      {/*
        1º gráfico: série histórica mês a mês.
        Respeita TODOS os filtros da página, inclusive os geográficos.
      */}
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
        />
      </section>

      {/*
        2º bloco: rankings nacionais lado a lado
        (estados à esquerda, municípios à direita).

        Propositalmente NÃO recebem regiao/estadoIbge/municipio:
        são sempre Brasil inteiro e respondem apenas a período,
        perspectiva, visão e segmento.
      */}
      <section className="charts-grid">
        <StateRanking
          porEstadoMensal={
            municipio?.porEstadoMensal ?? []
          }
          start={range.start}
          end={range.end}
          perspectiva={filtros.perspectiva}
          segmento={filtros.segmento}
          visao={filtros.visao}
        />

        <MunicipioRanking
          start={range.start}
          end={range.end}
          perspectiva={filtros.perspectiva}
          segmento={filtros.segmento}
          visao={filtros.visao}
        />
      </section>
    </>
  );
}