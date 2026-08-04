import { useEffect, useMemo, useRef, useState } from "react";
import { ChartCard } from "../../shared/ChartCard";
import { useI18n } from "../../../lib/i18n/I18nContext";
import { getFormatLang } from "../../../lib/format";
import {
  formatAnoMes,
  formatCurrencyCompact,
  formatCurrencyFull,
  formatNumberCompact,
} from "../../../lib/format";

/**
 * Entidades da dimensão NATUREZA.
 *
 * A base traz códigos no formato X2Y (P2P, B2G, G2B...), onde a primeira letra
 * é o pagador e a segunda o recebedor:
 * P = pessoa física, B = empresa (business), G = governo.
 */
const ENTIDADE_DEFS = [
  { code: "P", labelKey: "transacoesPage.matrixEntityPeople", short: "P" },
  { code: "B", labelKey: "transacoesPage.matrixEntityBusiness", short: "B" },
  { code: "G", labelKey: "transacoesPage.matrixEntityGovernment", short: "G" },
];

const NATUREZA_REGEX = /^([PBG])2([PBG])$/;

const METRICA_DEFS = [
  { value: "valor", labelKey: "transacoesPage.matrixMetricValue" },
  { value: "quantidade", labelKey: "transacoesPage.matrixMetricCount" },
  { value: "ticket", labelKey: "transacoesPage.matrixMetricTicket" },
];

/**
 * Intervalo entre quadros na reprodução automática (ms).
 */
const PLAY_INTERVAL_MS = 1100;

/**
 * Escala logarítmica de intensidade.
 *
 * As três métricas variam por ordens de grandeza dentro do mesmo mês
 * (ex.: em valor, B2B é ~300x G2G; em ticket médio, G2G é ~1800x o menor).
 * Numa escala linear quase todas as células ficariam no mesmo tom e a matriz
 * viraria dois quadrados escuros. O log preserva a leitura visual — e o número
 * exato aparece impresso em cada célula, então a cor serve para varredura e o
 * texto para precisão.
 */
function intensidadeLog(value, min, max) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (max <= 0 || max === min) return value > 0 ? 1 : 0;

  const logMin = Math.log10(Math.max(min, 1));
  const logMax = Math.log10(max);

  if (logMax === logMin) return 1;

  const t = (Math.log10(value) - logMin) / (logMax - logMin);

  return Math.min(Math.max(t, 0), 1);
}

/**
 * Texto escuro sobre fundo claro e vice-versa.
 */
function corDoTexto(intensidade) {
  return intensidade > 0.55 ? "#ffffff" : "var(--text-primary)";
}

function corDaCelula(intensidade) {
  if (intensidade <= 0) return "var(--surface-2, #f6f7f8)";

  // Faixa de 0.06 a 1 para que a célula mais fraca ainda seja visível.
  const alpha = 0.06 + intensidade * 0.94;

  return `color-mix(in srgb, var(--series-1) ${(alpha * 100).toFixed(1)}%, transparent)`;
}

export function NaturezaMatrix({ porNatureza = [] }) {
  const { t } = useI18n();
  const ENTIDADES = useMemo(
    () =>
      ENTIDADE_DEFS.map((e) => ({
        code: e.code,
        short: e.short,
        label: t(e.labelKey),
      })),
    [t]
  );
  const METRICAS = useMemo(
    () =>
      METRICA_DEFS.map((m) => ({
        value: m.value,
        label: t(m.labelKey),
      })),
    [t]
  );
  const percentLocale = getFormatLang() === "en" ? "en-US" : "pt-BR";
  const [metrica, setMetrica] = useState("valor");

  /**
   * Meses disponíveis na dimensão NATUREZA, ordenados.
   *
   * A matriz é sempre um retrato de UM mês — cruzar pagador x recebedor só faz
   * sentido num recorte temporal único. O slider percorre esta lista; o botão
   * de play a anima. Os filtros de período da página continuam sem efeito aqui,
   * de propósito.
   */
  const meses = useMemo(() => {
    return [
      ...new Set(
        porNatureza
          .map((row) => Number(row.AnoMes))
          .filter((anoMes) => Number.isFinite(anoMes))
      ),
    ].sort((a, b) => a - b);
  }, [porNatureza]);

  /**
   * Índice do mês em exibição. Começa no último mês fechado (comportamento
   * anterior) e é controlado pelo slider / play.
   */
  const [mesIndex, setMesIndex] = useState(0);
  const [tocando, setTocando] = useState(false);

  /*
   * Sempre que a lista de meses mudar (nova carga de dados), reposiciona no
   * último mês e para a reprodução — evita índice fora de faixa.
   */
  useEffect(() => {
    setMesIndex(meses.length > 0 ? meses.length - 1 : 0);
    setTocando(false);
  }, [meses.length]);

  /*
   * Reprodução automática: avança um mês por vez e volta ao início ao fim.
   */
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!tocando || meses.length <= 1) {
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      setMesIndex((current) => (current + 1) % meses.length);
    }, PLAY_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tocando, meses.length]);

  const indiceSeguro =
    meses.length === 0
      ? 0
      : Math.min(Math.max(mesIndex, 0), meses.length - 1);

  const mesReferencia = meses.length > 0 ? meses[indiceSeguro] : null;

  /**
   * Reagrupa as linhas do mês em uma matriz 3x3.
   *
   * "Nao disponivel" (e qualquer categoria fora do padrão X2Y) fica fora do
   * grid, mas é contabilizado à parte para a nota de rodapé — assim nada
   * some silenciosamente do total.
   */
  const { celulas, totais, foraDoGrid } = useMemo(() => {
    const doMes = porNatureza.filter(
      (row) => Number(row.AnoMes) === mesReferencia
    );

    const map = new Map();
    let valorGrid = 0;
    let quantidadeGrid = 0;
    let valorFora = 0;
    let quantidadeFora = 0;

    for (const row of doMes) {
      const match = NATUREZA_REGEX.exec(row.categoria ?? "");

      const valor = Number(row.VALOR) || 0;
      const quantidade = Number(row.QUANTIDADE) || 0;

      if (!match) {
        valorFora += valor;
        quantidadeFora += quantidade;
        continue;
      }

      const [, pagador, recebedor] = match;

      map.set(`${pagador}${recebedor}`, { valor, quantidade });

      valorGrid += valor;
      quantidadeGrid += quantidade;
    }

    return {
      celulas: map,
      totais: { valor: valorGrid, quantidade: quantidadeGrid },
      foraDoGrid: { valor: valorFora, quantidade: quantidadeFora },
    };
  }, [porNatureza, mesReferencia]);

  /**
   * Valor da métrica selecionada em uma célula.
   *
   * Ticket médio é uma razão por célula — nunca uma soma —, então pode ser
   * calculado direto de valor/quantidade daquele cruzamento.
   */
  const valorDaCelula = useMemo(() => {
    return (pagador, recebedor) => {
      const cell = celulas.get(`${pagador}${recebedor}`);

      if (!cell) return null;

      if (metrica === "valor") return cell.valor;
      if (metrica === "quantidade") return cell.quantidade;

      return cell.quantidade > 0 ? cell.valor / cell.quantidade : null;
    };
  }, [celulas, metrica]);

  const { minValor, maxValor } = useMemo(() => {
    const valores = [];

    for (const linha of ENTIDADES) {
      for (const coluna of ENTIDADES) {
        const v = valorDaCelula(linha.code, coluna.code);
        if (Number.isFinite(v) && v > 0) valores.push(v);
      }
    }

    return {
      minValor: valores.length ? Math.min(...valores) : 0,
      maxValor: valores.length ? Math.max(...valores) : 0,
    };
  }, [valorDaCelula]);

  const formatarValor = (value) => {
    if (!Number.isFinite(value)) return "—";
    if (metrica === "valor") return formatCurrencyCompact(value);
    if (metrica === "quantidade") return formatNumberCompact(value);
    return formatCurrencyFull(value);
  };

  /**
   * Participação da célula no total do mês.
   *
   * Não se aplica a ticket médio: uma razão não tem "fatia" de um total.
   */
  const percentualDaCelula = (value) => {
    if (metrica === "ticket") return null;

    const total = metrica === "valor" ? totais.valor : totais.quantidade;

    if (!total || !Number.isFinite(value)) return null;

    return (value / total) * 100;
  };

  const metricaSelector = (
    <label className="matrix-metric-select">
      {t("municipioPage.metric")}
      <select
        value={metrica}
        onChange={(event) => setMetrica(event.target.value)}
      >
        {METRICAS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );

  if (mesReferencia === null) {
    return (
      <ChartCard
        title={t("transacoesPage.matrixTitle")}
        subtitle={t("transacoesPage.matrixSubtitle")}
        fullWidth
      >
        <div className="state-message">
          {t("transacoesPage.matrixNoData")}
        </div>
      </ChartCard>
    );
  }

  const percentualFora =
    totais.valor + foraDoGrid.valor > 0
      ? (foraDoGrid.valor / (totais.valor + foraDoGrid.valor)) * 100
      : 0;

  const primeiroMes = meses[0];
  const ultimoMes = meses[meses.length - 1];

  return (
    <ChartCard
      title={t("transacoesPage.matrixTitle")}
      subtitle={t("transacoesPage.matrixSubMonth", { month: formatAnoMes(mesReferencia) })}
      tabs={metricaSelector}
      fullWidth
    >
      <div className="natureza-matrix">
        <div className="matrix-timeline">
          <button
            type="button"
            className="matrix-play"
            onClick={() => setTocando((current) => !current)}
            aria-label={tocando ? t("common.pause") : t("common.play")}
            disabled={meses.length <= 1}
          >
            {tocando ? "❚❚" : "►"}
          </button>

          <input
            type="range"
            className="matrix-slider"
            min={0}
            max={Math.max(meses.length - 1, 0)}
            value={indiceSeguro}
            onChange={(event) => {
              // Arrastar manualmente interrompe a reprodução.
              setTocando(false);
              setMesIndex(Number(event.target.value));
            }}
            aria-label={t("common.referenceMonth")}
          />

          <span className="matrix-timeline-label">
            {formatAnoMes(mesReferencia)}
          </span>
        </div>

        {meses.length > 1 && (
          <div className="matrix-timeline-range">
            <span>{formatAnoMes(primeiroMes)}</span>
            <span>{formatAnoMes(ultimoMes)}</span>
          </div>
        )}

        <table className="natureza-matrix-table">
          <thead>
            <tr>
              <th scope="col" className="natureza-matrix-corner">
                <span className="natureza-matrix-corner-pagador">{t("transacoesPage.matrixPayer")}</span>
                <span className="natureza-matrix-corner-recebedor">
                  {t("transacoesPage.matrixReceiver")}
                </span>
              </th>
              {ENTIDADES.map((coluna) => (
                <th key={coluna.code} scope="col">
                  {coluna.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {ENTIDADES.map((linha) => (
              <tr key={linha.code}>
                <th scope="row">{linha.label}</th>

                {ENTIDADES.map((coluna) => {
                  const value = valorDaCelula(linha.code, coluna.code);
                  const intensidade = intensidadeLog(value, minValor, maxValor);
                  const percentual = percentualDaCelula(value);

                  return (
                    <td
                      key={coluna.code}
                      style={{
                        background: corDaCelula(intensidade),
                        color: corDoTexto(intensidade),
                      }}
                      title={`${linha.label} → ${coluna.label} (${linha.short}2${coluna.short})`}
                    >
                      <span className="natureza-matrix-value">
                        {formatarValor(value)}
                      </span>

                      {percentual !== null && (
                        <span className="natureza-matrix-share">
                          {percentual < 0.01 && percentual > 0
                            ? (percentLocale === "en-US" ? "<0.01%" : "<0,01%")
                            : `${percentual.toLocaleString(percentLocale, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}%`}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <p className="natureza-matrix-note">
          {t("transacoesPage.matrixNoteLog")}
          {metrica !== "ticket" && t("transacoesPage.matrixNoteShare")}
        </p>

        <p className="natureza-matrix-note">
          {t("transacoesPage.matrixNoteOutLead")}
          {percentualFora < 0.01
            ? t("transacoesPage.matrixLessThan")
            : `${percentualFora.toLocaleString(percentLocale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}%`}
          {t("transacoesPage.matrixNoteOutTail", {
            count: formatNumberCompact(foraDoGrid.quantidade),
          })}
        </p>
      </div>
    </ChartCard>
  );
}