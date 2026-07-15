import { useMemo, useState } from "react";
import { ChartCard } from "../../shared/ChartCard";
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
const ENTIDADES = [
  { code: "P", label: "Pessoas", short: "P" },
  { code: "B", label: "Empresas", short: "B" },
  { code: "G", label: "Governo", short: "G" },
];

const NATUREZA_REGEX = /^([PBG])2([PBG])$/;

const METRICAS = [
  { value: "valor", label: "Valor (R$)" },
  { value: "quantidade", label: "Transações" },
  { value: "ticket", label: "Ticket médio" },
];

const METRICA_LABEL = {
  valor: "valor transacionado",
  quantidade: "transações liquidadas",
  ticket: "ticket médio",
};

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
  const [metrica, setMetrica] = useState("valor");

  /**
   * Último mês disponível na dimensão NATUREZA.
   *
   * A matriz é sempre um retrato de um mês: os filtros de período da página
   * não a afetam de propósito. Cruzar pagador x recebedor só faz sentido em
   * um recorte temporal único.
   */
  const mesReferencia = useMemo(() => {
    const meses = porNatureza
      .map((row) => Number(row.AnoMes))
      .filter((anoMes) => Number.isFinite(anoMes));

    return meses.length > 0 ? Math.max(...meses) : null;
  }, [porNatureza]);

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
      Métrica
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
        title="Fluxo entre Pessoas, Empresas e Governo"
        subtitle="Cruzamento de pagador e recebedor na dimensão Natureza."
        fullWidth
      >
        <div className="state-message">
          Não há dados de natureza disponíveis.
        </div>
      </ChartCard>
    );
  }

  const percentualFora =
    totais.valor + foraDoGrid.valor > 0
      ? (foraDoGrid.valor / (totais.valor + foraDoGrid.valor)) * 100
      : 0;

  return (
    <ChartCard
      title="Fluxo entre Pessoas, Empresas e Governo"
      subtitle={`Quem paga (linhas) e quem recebe (colunas) em ${formatAnoMes(
        mesReferencia
      )}, o último mês fechado da base. Sempre um único mês — os filtros de período da página não afetam esta matriz.`}
      tabs={metricaSelector}
      fullWidth
    >
      <div className="natureza-matrix">
        <table className="natureza-matrix-table">
          <thead>
            <tr>
              <th scope="col" className="natureza-matrix-corner">
                <span className="natureza-matrix-corner-pagador">Pagador</span>
                <span className="natureza-matrix-corner-recebedor">
                  Recebedor
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
                            ? "<0,01%"
                            : `${percentual.toLocaleString("pt-BR", {
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
          A intensidade da cor usa escala logarítmica: as células variam por
          ordens de grandeza e, numa escala linear, quase todas ficariam no
          mesmo tom. Use os números para comparações precisas.
          {metrica !== "ticket" &&
            " Os percentuais são a participação de cada cruzamento no total do mês."}
        </p>

        <p className="natureza-matrix-note">
          Transações sem natureza identificada na base (&ldquo;Não
          disponível&rdquo;) ficam fora da matriz: representam{" "}
          {percentualFora < 0.01
            ? "menos de 0,01%"
            : `${percentualFora.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}%`}{" "}
          do valor do mês ({formatNumberCompact(foraDoGrid.quantidade)}{" "}
          transações) e não se encaixam em nenhum par pagador–recebedor.
        </p>
      </div>
    </ChartCard>
  );
}