// Baixa dados públicos da API do Pix (Banco Central) e gera snapshots
// JSON estáticos em public/data/. Reexecute este script para atualizar
// os dados exibidos no dashboard (não há fetch ao vivo no navegador).
//
// Uso: node scripts/fetch-data.mjs

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ufPorEstadoIbge } from "../src/lib/uf.js";

const BASE = "https://olinda.bcb.gov.br/olinda/servico/Pix_DadosAbertos/versao/v1/odata";
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "data");
const MUNICIPIOS_DIR = join(OUT_DIR, "municipios");

// A API ignora o parâmetro de data das funções (Database/DataBase/Data) para fins
// de filtro — ele é obrigatório na assinatura, mas sempre retorna o histórico
// completo (desde o lançamento do Pix, nov/2020). $top é o único limite real, e
// como as linhas não vêm ordenadas cronologicamente, um $top baixo demais corta
// uma fatia proporcional de TODOS os meses (não só os mais recentes) — foi assim
// que o snapshot anterior acabou só com dados de mai/2025 em diante. Por isso o
// default é alto o suficiente para nunca truncar (dataset atual: ~715k linhas em
// EstatisticasTransacoesPix, ~385k em TransacoesPixPorMunicipio).
const DEFAULT_TOP = 500000;

async function fetchAll(entity, functionParam, top = DEFAULT_TOP) {
  const url = `${BASE}/${entity}${functionParam ? `(${functionParam})` : ""}?$format=json&$top=${top}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${entity}: HTTP ${res.status}`);
  const json = await res.json();
  const rows = json.value;
  if (rows.length === top) {
    console.warn(`${entity}: retornou exatamente $top=${top} linhas — pode estar truncado, considere aumentar o limite.`);
  }
  return rows;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// --- Usuários cadastrados no DICT (já vem em granularidade mensal) ---
async function buildUsuariosDict() {
  const rows = await fetchAll("PixUsuariosCadastradosDICT");
  rows.sort((a, b) => a.DataGraficosPix.localeCompare(b.DataGraficosPix));
  return rows.map((r) => ({
    data: r.DataGraficosPix,
    pessoaFisica: r.qtdUsuariosPessoaFisica,
    pessoaJuridica: r.qtdUsuariosPessoaJuridica,
    total: r.qtdUsuariosCadastradosDICTTotal,
  }));
}

// --- Estatísticas de transações Pix ---
// Dataset bruto vem quebrado em várias dimensões (idade, forma de iniciação,
// natureza, finalidade, região, PF/PJ) por mês, ~200k linhas. Agregamos em
// cubos pequenos: total mensal + total mensal por categoria de cada dimensão.
function aggregateBy(rows, keyFn) {
  const map = new Map();
  for (const r of rows) {
    const key = keyFn(r);
    const cur = map.get(key) ?? { VALOR: 0, QUANTIDADE: 0 };
    cur.VALOR += r.VALOR ?? 0;
    cur.QUANTIDADE += r.QUANTIDADE ?? 0;
    map.set(key, cur);
  }
  return map;
}

async function buildTransacoes() {
  const rows = await fetchAll("EstatisticasTransacoesPix", "Database=%27202001%27", 1500000);

  const mensalMap = aggregateBy(rows, (r) => r.AnoMes);
  const mensal = [...mensalMap.entries()]
    .map(([AnoMes, v]) => ({ AnoMes, VALOR: round2(v.VALOR), QUANTIDADE: v.QUANTIDADE }))
    .sort((a, b) => a.AnoMes - b.AnoMes);

  function porDimensao(field) {
    const map = aggregateBy(rows, (r) => `${r.AnoMes}|${r[field] ?? "Não informado"}`);
    return [...map.entries()]
      .map(([key, v]) => {
        const [AnoMes, categoria] = key.split("|");
        return {
          AnoMes: Number(AnoMes),
          categoria,
          VALOR: round2(v.VALOR),
          QUANTIDADE: v.QUANTIDADE,
        };
      })
      .sort((a, b) => a.AnoMes - b.AnoMes);
  }

  return {
    mensal,
    porRegiaoPagador: porDimensao("PAG_REGIAO"),
    porPFPJPagador: porDimensao("PAG_PFPJ"),
    porNatureza: porDimensao("NATUREZA"),
    porFinalidade: porDimensao("FINALIDADE"),
    porFormaIniciacao: porDimensao("FORMAINICIACAO"),
  };
}

// --- Transações Pix por Município ---
// Dataset bruto é por município (~5.5k) por mês (~83k linhas). Agregamos por
// estado para viabilizar mapa/filtro sem enviar granularidade municipal.
function buildMunicipio(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = `${r.AnoMes}|${r.Estado}`;
    const cur = map.get(key) ?? {
      Estado: r.Estado,
      Estado_Ibge: r.Estado_Ibge,
      Sigla_Regiao: r.Sigla_Regiao,
      Regiao: r.Regiao,
      VL_PagadorPF: 0,
      QT_PagadorPF: 0,
      VL_PagadorPJ: 0,
      QT_PagadorPJ: 0,
      VL_RecebedorPF: 0,
      QT_RecebedorPF: 0,
      VL_RecebedorPJ: 0,
      QT_RecebedorPJ: 0,
    };
    cur.VL_PagadorPF += r.VL_PagadorPF ?? 0;
    cur.QT_PagadorPF += r.QT_PagadorPF ?? 0;
    cur.VL_PagadorPJ += r.VL_PagadorPJ ?? 0;
    cur.QT_PagadorPJ += r.QT_PagadorPJ ?? 0;
    cur.VL_RecebedorPF += r.VL_RecebedorPF ?? 0;
    cur.QT_RecebedorPF += r.QT_RecebedorPF ?? 0;
    cur.VL_RecebedorPJ += r.VL_RecebedorPJ ?? 0;
    cur.QT_RecebedorPJ += r.QT_RecebedorPJ ?? 0;
    map.set(key, cur);
  }

  const porEstadoMensal = [...map.entries()]
    .map(([key, v]) => {
      const [AnoMes] = key.split("|");
      return {
        AnoMes: Number(AnoMes),
        Estado: v.Estado,
        Estado_Ibge: v.Estado_Ibge,
        Sigla_Regiao: v.Sigla_Regiao,
        Regiao: v.Regiao,
        VL_PagadorPF: round2(v.VL_PagadorPF),
        QT_PagadorPF: v.QT_PagadorPF,
        VL_PagadorPJ: round2(v.VL_PagadorPJ),
        QT_PagadorPJ: v.QT_PagadorPJ,
        VL_RecebedorPF: round2(v.VL_RecebedorPF),
        QT_RecebedorPF: v.QT_RecebedorPF,
        VL_RecebedorPJ: round2(v.VL_RecebedorPJ),
        QT_RecebedorPJ: v.QT_RecebedorPJ,
      };
    })
    .sort((a, b) => a.AnoMes - b.AnoMes || a.Estado.localeCompare(b.Estado));

  return { porEstadoMensal };
}

// --- Transações Pix por Município (granularidade municipal) ---
// Mesmo dataset bruto de buildMunicipio, mas sem descartar Municipio_Ibge:
// um índice com um registro por município (para nome/UF/região) e, por
// estado, a série mensal de cada município (para mapas/rankings municipais).
function buildMunicipiosDetalhado(rows) {
  const indexMap = new Map();
  const porEstadoMap = new Map();

  for (const r of rows) {
    // Linhas sem município identificado (Municipio_Ibge nulo, Estado "NAO
    // INFORMADO") ficam fora do cubo municipal — elas geravam um null.json e
    // um registro inválido no índice. Continuam contabilizadas no agregado
    // por estado (buildMunicipio), então nenhum total se perde.
    if (r.Municipio_Ibge == null || r.Estado_Ibge == null) continue;

    if (!indexMap.has(r.Municipio_Ibge)) {
      indexMap.set(r.Municipio_Ibge, {
        ibge: r.Municipio_Ibge,
        nome: r.Municipio,
        estadoIbge: r.Estado_Ibge,
        estado: r.Estado,
        uf: ufPorEstadoIbge(r.Estado_Ibge),
        regiao: r.Regiao,
      });
    }

    const serie = porEstadoMap.get(r.Estado_Ibge) ?? [];
    serie.push({
      AnoMes: r.AnoMes,
      Municipio_Ibge: r.Municipio_Ibge,
      VL_PagadorPF: round2(r.VL_PagadorPF ?? 0),
      QT_PagadorPF: r.QT_PagadorPF ?? 0,
      QT_PES_PagadorPF: r.QT_PES_PagadorPF ?? 0,
      VL_PagadorPJ: round2(r.VL_PagadorPJ ?? 0),
      QT_PagadorPJ: r.QT_PagadorPJ ?? 0,
      QT_PES_PagadorPJ: r.QT_PES_PagadorPJ ?? 0,
    });
    porEstadoMap.set(r.Estado_Ibge, serie);
  }

  const index = [...indexMap.values()].sort((a, b) => a.nome.localeCompare(b.nome));

  for (const serie of porEstadoMap.values()) {
    serie.sort((a, b) => a.AnoMes - b.AnoMes || a.Municipio_Ibge - b.Municipio_Ibge);
  }

  return { index, porEstado: porEstadoMap };
}

// --- Estoque de Chaves Pix por Participante ---
// Assim como EstatisticasTransacoesPix e TransacoesPixPorMunicipio, a API
// ignora o parâmetro Data para fins de filtro (obrigatório na assinatura, mas
// sempre retorna o histórico completo desde nov/2020, ~400k linhas). Uma
// chamada com $top alto basta; agregamos meses e participantes no cliente.
function porMesChaves(rows) {
  const map = new Map();
  for (const r of rows) {
    const cur = map.get(r.Data) ?? { PF: 0, PJ: 0 };
    cur[r.NaturezaUsuario] = (cur[r.NaturezaUsuario] ?? 0) + r.qtdChaves;
    map.set(r.Data, cur);
  }
  return [...map.entries()]
    .map(([data, v]) => ({ data, PF: v.PF, PJ: v.PJ, total: v.PF + v.PJ }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

function porParticipanteDeChaves(rows) {
  const map = new Map();
  for (const r of rows) {
    const cur = map.get(r.Nome) ?? { participante: r.Nome, PF: 0, PJ: 0 };
    cur[r.NaturezaUsuario] = (cur[r.NaturezaUsuario] ?? 0) + r.qtdChaves;
    map.set(r.Nome, cur);
  }
  return [...map.values()]
    .map((v) => ({ ...v, total: v.PF + v.PJ }))
    .sort((a, b) => b.total - a.total);
}

// Série mensal por participante, separada em PF e PJ. Diferente de
// porMesChaves (que soma todos os participantes) e de porParticipanteDeChaves
// (que fica só no último mês), aqui preservamos Data x Nome x NaturezaUsuario
// para permitir uma série histórica por participante. Cada painel (PF/PJ)
// traz seu próprio top 10, ranqueado pelo estoque no último mês.
function topParticipantesSerieDeChaves(rows, topN = 10) {
  const meses = [...new Set(rows.map((r) => r.Data.slice(0, 7)))].sort();
  const mesIndex = new Map(meses.map((mes, i) => [mes, i]));

  // natureza -> nome -> array alinhado a `meses`
  const acc = { PF: new Map(), PJ: new Map() };

  for (const r of rows) {
    const natureza = r.NaturezaUsuario;
    if (natureza !== "PF" && natureza !== "PJ") continue;

    const bucket = acc[natureza];
    let serie = bucket.get(r.Nome);
    if (!serie) {
      serie = new Array(meses.length).fill(0);
      bucket.set(r.Nome, serie);
    }
    serie[mesIndex.get(r.Data.slice(0, 7))] += r.qtdChaves;
  }

  function buildPanel(bucket) {
    const participantes = [...bucket.entries()]
      .map(([nome, serie]) => ({ nome, ultimo: serie[serie.length - 1] ?? 0 }))
      .sort((a, b) => b.ultimo - a.ultimo)
      .slice(0, topN)
      .map((p) => p.nome);

    const series = {};
    for (const nome of participantes) {
      series[nome] = bucket.get(nome);
    }
    return { participantes, series };
  }

  return { meses, PF: buildPanel(acc.PF), PJ: buildPanel(acc.PJ) };
}

function buildChavesPix(rows) {
  const historico = porMesChaves(rows);
  const ultimaData = historico[historico.length - 1].data;
  const porParticipante = porParticipanteDeChaves(rows.filter((r) => r.Data === ultimaData));
  const topParticipantesSerie = topParticipantesSerieDeChaves(rows);

  return { data: ultimaData, historico, porParticipante, topParticipantesSerie };
}

async function main() {
  console.log("Baixando Usuários cadastrados no DICT...");
  const usuariosDict = await buildUsuariosDict();

  console.log("Baixando Estatísticas de transações Pix (~700k linhas, histórico completo desde nov/2020, pode levar ~1min)...");
  const transacoes = await buildTransacoes();

  console.log("Baixando Transações Pix por Município (~400k linhas, histórico completo desde nov/2020, pode levar ~30s)...");
  const municipioRows = await fetchAll("TransacoesPixPorMunicipio", "DataBase=%27202001%27", 800000);
  const municipio = buildMunicipio(municipioRows);
  const municipiosDetalhado = buildMunicipiosDetalhado(municipioRows);

  console.log("Baixando Estoque de Chaves Pix (~400k linhas, histórico completo desde nov/2020)...");
  const chavesRows = await fetchAll("ChavesPix", "Data=%272020-11-30%27", 600000);
  const chaves = buildChavesPix(chavesRows);

  const generatedAt = new Date().toISOString();

  await writeFile(join(OUT_DIR, "usuarios_dict.json"), JSON.stringify({ generatedAt, dados: usuariosDict }));
  await writeFile(join(OUT_DIR, "transacoes.json"), JSON.stringify({ generatedAt, ...transacoes }));
  await writeFile(join(OUT_DIR, "municipio.json"), JSON.stringify({ generatedAt, ...municipio }));
  await writeFile(join(OUT_DIR, "chaves.json"), JSON.stringify({ generatedAt, ...chaves }));

  await writeFile(
    join(OUT_DIR, "municipios-index.json"),
    JSON.stringify({ generatedAt, municipios: municipiosDetalhado.index })
  );

  await mkdir(MUNICIPIOS_DIR, { recursive: true });
  for (const [estadoIbge, serie] of municipiosDetalhado.porEstado) {
    await writeFile(join(MUNICIPIOS_DIR, `${estadoIbge}.json`), JSON.stringify({ generatedAt, dados: serie }));
  }

  console.log(`OK. Arquivos gerados em ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});