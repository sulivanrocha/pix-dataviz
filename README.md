# Dashboard Pix

Dashboard de visualização de dados públicos do Pix, com dados abertos do
Banco Central do Brasil (API OData `Pix_DadosAbertos`). React + Vite +
Recharts, filtrável por período diretamente na página.

## Rodando localmente

```
npm install
node scripts/fetch-data.mjs   # baixa e agrega os dados da API do BC (~1 min)
npm run dev
```

Abra http://localhost:5173.

## Como os dados funcionam

Não há chamadas à API a partir do navegador. `scripts/fetch-data.mjs` baixa
os três conjuntos de dados abaixo, agrega em cubos pequenos e grava JSON
estático em `public/data/`, que o app consome via `fetch()`:

| Arquivo | Fonte (endpoint OData) | Conteúdo |
|---|---|---|
| `usuarios_dict.json` | `PixUsuariosCadastradosDICT` | Estoque mensal de usuários PF/PJ cadastrados no DICT (histórico completo desde 2020) |
| `transacoes.json` | `EstatisticasTransacoesPix` | Total mensal (valor/quantidade) + composição por natureza, finalidade, forma de iniciação, região e PF/PJ do pagador |
| `municipio.json` | `TransacoesPixPorMunicipio` | Valor/quantidade agregados por estado e mês (a partir do dado bruto por município) |

O dataset bruto de transações tem ~200 mil linhas e o de município ~80 mil —
por isso são agregados em cubos pequenos no momento do fetch, em vez de
enviados crus para o navegador.

**Para atualizar os dados**, reexecute `node scripts/fetch-data.mjs` e
publique de novo (os JSON ficam versionados em `public/data/`). Não há
atualização automática agendada.

## Escopo desta primeira versão

Inclui: estatísticas de transações Pix, usuários cadastrados no DICT e
transações por município (agregado por estado). Não inclui ainda: estoque de
chaves Pix por participante e estatísticas de fraude/MED — a API do BC já
expõe ambos (`ChavesPix`, `EstatisticasFraudesPix`) caso queira adicionar.

## Build e publicação

```
npm run build   # gera dist/
```

`dist/` é um site estático puro — pode ser publicado em Vercel, Netlify,
GitHub Pages ou qualquer host de arquivos estáticos. Lembre de rodar
`node scripts/fetch-data.mjs` antes do build para incluir os dados mais
recentes em `public/data/`.
