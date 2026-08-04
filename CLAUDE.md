# CLAUDE.md

Guidelines for working on this DataViz project.

## 1. Think Before Coding

- State assumptions when they materially affect the implementation.
- When multiple valid approaches exist, briefly explain the tradeoff.
- Prefer the simplest reasonable interpretation for low-risk details.
- Ask a focused question only when ambiguity could cause substantial rework.

## 2. Simplicity First

- Follow YAGNI principles.
- Prefer the simplest readable solution.
- Do not add features, abstractions, or configuration that were not requested.
- Avoid premature optimization.
- If a solution is substantially longer than necessary, simplify it.

## 3. Surgical Changes

- Modify only files and lines required for the requested task.
- Do not refactor unrelated code.
- Match the existing code style.
- Remove only imports, variables, or functions made unused by your own changes.
- Mention unrelated issues rather than fixing them without permission.
- Never manually edit generated files inside `dist`.

## 4. Project Architecture

Actual directory layout (keep new code consistent with it):

- `src/components/shared` — reusable UI primitives (`ChartCard`, `CsvDownloadButton`,
  `ChartTooltip`, `Filters`, `StatTile`, `TabNav`).
- `src/components/charts/<dataset>` — visualization components, grouped by dataset
  (`chaves`, `dict`, `municipio`, `transacoes`).
- `src/pages` — page-level composition, one file per tab route.
- `src/lib` — data hooks, formatting, CSV export, and static config
  (`usePixData`, `format`, `exportCsv`, `tabs`, `uf`, `categories`, etc.).
- `public/data` — static dataset snapshots served to the app.
- `scripts` — data-fetching tooling (`fetch-data.mjs`).

Rules:

- Do not combine data fetching, data cleaning, and chart rendering in one component.
  Hooks in `src/lib` fetch; pages filter and compose; chart components render.
- Pass prepared data into visualization components through props.
- Do not hardcode API data inside chart components.

## 5. Data Visualization Standards

- Select chart types based on the analytical question.
- Prefer clarity and visual hierarchy over novelty.
- Use advanced visual forms only when they communicate the data better.
- Every visualization should have a clear title, unit, source, and relevant tooltip.
- Use consistent number, currency, percentage, and date formatting (via `src/lib/format`).
- Avoid misleading scales, unnecessary 3D effects, and visual clutter.
- Ensure visualizations work on desktop and mobile.
- Include loading, empty, and error states.
- Use accessible labels and sufficient contrast.

### 5.1 CSV Export (required on every chart)

Every chart is a data view, and every data view must be downloadable. There are no
exceptions: a chart without a CSV export is considered incomplete.

- Render `CsvDownloadButton` (`src/components/shared/CsvDownloadButton`) for each chart.
- Place it in the `ChartCard` `tabs` slot, alongside any `Filters`. When both are
  present, wrap them in a single flex container (see `UsersGrowthChart` for the
  reference pattern).
- Build a dedicated `exportRows` array with `useMemo`, deriving it from the same data
  the chart renders. Use human-readable, Portuguese column headers (e.g. `Mês`,
  `Pessoa física`) rather than internal field names.
- Pass a descriptive, kebab-case `filename` ending in `.csv`
  (e.g. `usuarios-dict.csv`, `ranking-municipios.csv`).
- The button disables itself automatically when the data array is empty; do not add
  separate guard logic.
- A chart that displays multiple distinct series/panels (e.g. PF and PJ side by side)
  exports a single CSV containing all series as columns, not one file per panel.

Charts still missing this control (bring them to standard when touched):
`MunicipioRanking`, `StateRanking`, `RegiaoSummaryChart`, `CategoryBreakdown`,
`NaturezaMatrix`, `TrendChart`.

### 5.2 Glossary (required on every content page)

Each of the four content pages — Usuários (`UsuariosDictPage`), Chaves
(`ChavesPixPage`), Transações por Município (`TransacoesMunicipioPage`), and
Estatísticas de Transações (`EstatisticasTransacoesPage`) — must end with a glossary
section explaining the acronyms and key terms used on that page. The Visão geral
(`OverviewPage`) is exempt, as it is a non-technical landing page.

- Reuse the existing markup and styles (`.definitions-section`, `.definitions-eyebrow`,
  `.definitions-item`, `<dl>/<dt>/<dd>`) exactly as implemented in `UsuariosDictPage`.
  Do not introduce new glossary styling.
- Render the glossary as the last `<section>` on the page, after the charts.
- Define each page's terms in a page-local `*_DEFINITIONS` constant — an array of
  `{ term, description }` objects — matching the shape of `DICT_DEFINITIONS`.
- Cover every non-obvious acronym and domain term that appears on the page (e.g. DICT,
  PF/PJ, ISS, RREO, IBGE, natureza, finalidade, forma de iniciação). Each definition
  should spell out the acronym on first use and explain it in plain Portuguese.
- Keep definitions accurate to the Banco Central source semantics; when a term maps to
  a specific API field or dataset column, describe what that field actually measures.

## 6. Data and Performance

- Avoid unnecessary repeated API requests.
- Cache, preprocess, or aggregate data when appropriate.
- Avoid rendering very large datasets as thousands of SVG elements.
- Consider Canvas or WebGL for large-scale visualizations.
- Do not expose private credentials in frontend code.
- Remember that Vite variables prefixed with `VITE_` are visible to the browser.

## 7. Goal-Driven Execution

For multi-step tasks, provide a brief plan:

1. Change → verification method
2. Change → verification method
3. Change → verification method

Define success in verifiable terms.

Examples:

- "Fix chart responsiveness" → verify at desktop, tablet, and mobile widths.
- "Add CSV export to a chart" → verify the button renders, downloads a file with the
  expected headers, and disables when data is empty.
- "Add a page glossary" → verify the section renders last, covers every term on the
  page, and reuses `.definitions-section` styling.

## 8. Verification

After meaningful changes:

1. Run `npm run build`.
2. Run linting or tests if configured.
3. Check for browser console errors.
4. Verify the affected page visually, including CSV export and glossary where relevant.
5. Report:
   - files changed;
   - checks performed;
   - assumptions;
   - unresolved issues.

## 9. Scope Discipline

Every changed line should be directly connected to the requested task.

These guidelines are successful when the project remains readable, visualizations remain accurate, every chart is downloadable, every content page is self-explanatory, and code changes are small and easy to review.
