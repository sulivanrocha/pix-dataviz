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

- Keep reusable UI components in `src/components`.
- Keep visualizations in `src/components/charts`.
- Keep API access in `src/services`.
- Keep formatting and transformation functions in `src/utils`.
- Keep static datasets and configuration in `src/data`.
- Keep page-level composition in `src/App` or page components.
- Do not combine API fetching, data cleaning, and chart rendering in one large component.
- Pass prepared data into visualization components through props.

## 5. Data Visualization Standards

- Select chart types based on the analytical question.
- Prefer clarity and visual hierarchy over novelty.
- Use advanced visual forms only when they communicate the data better.
- Every visualization should have a clear title, unit, source, and relevant tooltip.
- Use consistent number, currency, percentage, and date formatting.
- Avoid misleading scales, unnecessary 3D effects, and visual clutter.
- Ensure visualizations work on desktop and mobile.
- Include loading, empty, and error states.
- Use accessible labels and sufficient contrast.
- Do not hardcode API data inside chart components.

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

- “Fix chart responsiveness” → verify at desktop, tablet, and mobile widths.
- “Add API integration” → verify successful, loading, empty, and error states.
- “Change data transformation” → verify expected totals and sample records.

## 8. Verification

After meaningful changes:

1. Run `npm run build`.
2. Run linting or tests if configured.
3. Check for browser console errors.
4. Verify the affected page visually.
5. Report:
   - files changed;
   - checks performed;
   - assumptions;
   - unresolved issues.

## 9. Scope Discipline

Every changed line should be directly connected to the requested task.

These guidelines are successful when the project remains readable, visualizations remain accurate, and code changes are small and easy to review.