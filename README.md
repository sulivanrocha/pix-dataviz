# Dashboard Pix

Dashboard de visualização de dados públicos do Pix, construído a partir dos
dados abertos do Banco Central do Brasil (API OData `Pix_DadosAbertos`).
React + Vite + Recharts, com filtros de período, região e segmento
diretamente na página.

> Projeto independente. Não é um serviço oficial do Banco Central — apenas
> os dados são de fonte oficial.

## O que o painel mostra

| Aba | Pergunta que responde |
|---|---|
| Visão geral | O que existe em cada aba e de onde vêm os dados |
| Usuários | Quantas pessoas (PF) e empresas (PJ) já têm Pix, mês a mês |
| Chaves | Quantas chaves Pix existem, evolução histórica e distribuição por instituição participante |
| Transações por Município | Como o valor e a quantidade de transações se distribuem por região, estado e município |
| Estatísticas de Transações | Quanto o Pix movimenta por mês, com composição por natureza, finalidade, forma de iniciação, região e tipo de pagador |

## Rodando localmente

```
npm install
node scripts/fetch-data.mjs   # baixa e agrega os dados da API do BC (~1–2 min)
npm run dev
```

Abra http://localhost:5173.

Outros comandos: `npm run lint` (oxlint) e `npm run build` (gera `dist/`).

## Como os dados funcionam

Não há chamadas à API a partir do navegador. `scripts/fetch-data.mjs` baixa
os conjuntos de dados abaixo, agrega em cubos pequenos e grava JSON estático
em `public/data/`, que o app consome via `fetch()`:

| Arquivo | Fonte (endpoint OData) | Conteúdo |
|---|---|---|
| `usuarios_dict.json` | `PixUsuariosCadastradosDICT` | Estoque mensal de usuários PF/PJ cadastrados no DICT (histórico completo desde 2020) |
| `transacoes.json` | `EstatisticasTransacoesPix` | Total mensal (valor/quantidade) + composição por natureza, finalidade, forma de iniciação, região e PF/PJ do pagador |
| `chaves.json` | `ChavesPix` | Estoque de chaves Pix: série mensal PF/PJ, ranking por participante no último mês e série histórica dos top 10 participantes por tipo |
| `municipio.json` | `TransacoesPixPorMunicipio` | Valor/quantidade agregados por estado e mês (a partir do dado bruto por município) |
| `municipios-index.json` | `TransacoesPixPorMunicipio` | Índice com um registro por município (ibge, nome, estado, uf, região), sem granularidade mensal |
| `municipios/{Estado_Ibge}.json` | `TransacoesPixPorMunicipio` | Um arquivo por estado (27 no total) com a série mensal de cada município daquele estado |

Os datasets brutos somam mais de 1 milhão de linhas (~715k em
`EstatisticasTransacoesPix`, ~385k em `TransacoesPixPorMunicipio`, ~400k em
`ChavesPix`) — por isso são agregados em cubos pequenos no momento do fetch,
em vez de enviados crus para o navegador. `municipios-index.json` e
`municipios/*.json` são gerados do mesmo dado bruto que alimenta
`municipio.json`, mas preservam a granularidade municipal (`Municipio_Ibge`)
em vez de agregar só por estado — use-os quando precisar de dado por
município. O índice e os arquivos por estado só carregam quando o usuário
navega até a seleção de município.

### Cuidados ao usar os dados

**`QT_PES_PagadorPF` e `QT_PES_PagadorPJ`** (em `municipios/*.json`) são
contagens de pessoas *distintas* que pagaram naquele município naquele mês.
Uma mesma pessoa pode aparecer em vários meses, então **não some esses campos
entre meses** — o resultado não é "total de pessoas únicas no período", é uma
contagem inflada por reaparições. Para um total no período seria necessário
reprocessar a partir do dado bruto (não incluído nestes snapshots agregados).

**A API do BC ignora o parâmetro de data das funções OData**
(`Database`/`DataBase`/`Data`): ele é obrigatório na assinatura, mas o
retorno é sempre o histórico completo desde nov/2020. O único limite real é
`$top`, e como as linhas não vêm em ordem cronológica, um `$top` baixo demais
corta uma fatia proporcional de *todos* os meses — não só dos mais recentes.
`fetch-data.mjs` usa limites altos o suficiente para não truncar e avisa no
console se o retorno bater exatamente no limite.

### Atualizando os dados

Reexecute `node scripts/fetch-data.mjs` e publique de novo (os JSON ficam
versionados em `public/data/`). Não há atualização automática agendada.

## Escopo atual

Inclui: estatísticas de transações Pix, usuários cadastrados no DICT,
estoque de chaves Pix por participante e transações por município (com
detalhe municipal). Não inclui ainda: estatísticas de fraude/MED — a API do
BC já expõe esse dataset (`EstatisticasFraudesPix`) caso queira adicionar.

## Build e publicação

```
node scripts/fetch-data.mjs   # garante dados atualizados em public/data/
npm run build                 # gera dist/
```

`dist/` é um site estático puro, publicável em Vercel, Netlify ou qualquer
host que sirva o site na **raiz do domínio**. Para publicar em um sub-caminho
(ex.: GitHub Pages em `usuario.github.io/pix-dataviz/`), é preciso antes
configurar `base` no `vite.config.js` e trocar os caminhos absolutos de fetch
(`/data/...`) por `import.meta.env.BASE_URL` — sem isso, os JSON retornam 404.

## Estrutura do código

```
scripts/fetch-data.mjs      # download + agregação dos dados do BC
public/data/                # snapshots JSON versionados
src/
  App.jsx                   # composição das abas
  pages/                    # uma página por aba
  components/charts/        # visualizações (Recharts)
  components/shared/        # ChartCard, Filters, StatTile, tooltip, CSV etc.
  lib/                      # formatação, cores, cubos, hooks de dados
```

## Fonte dos dados

[Dados Abertos do Banco Central do Brasil — Pix](https://dadosabertos.bcb.gov.br/dataset/pix)
