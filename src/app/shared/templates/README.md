# Templates layer

In this Angular codebase, **routes ARE the templates+pages composition**:

- **Authenticated layout template** = `src/app/app.html` + `src/app/app.css`
  (`app-sidebar` + `app-header` + `router-outlet` + `app-global-loader`).
  Shell organisms live in `../organisms/` (sidebar, header, notifications,
  global-loader is an atom). No logic was duplicated here, so no new
  wrapper component was created — abstracting it would add indirection
  without reuse value.
- **Public layout template** = `pages/public-website` (intentionally
  non-Material standalone renderer) and `pages/document-sign` (unauthenticated).
  These must NOT be merged into the admin design system.
- **Page layouts** = each directory under `src/app/pages/` composes atoms →
  molecules → organisms for one route. Conventions (page-container,
  page-header, stats-grid, data-table, filter-bar) are standardized in the
  global `src/styles.css` Lux Dark system and intentionally left centralized
  there to avoid visual regressions.

Rule: put reusable UI in atoms/molecules/organisms; keep route composition
in pages. Do not add business logic to templates.
