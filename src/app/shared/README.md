# Shared Atomic Design layer

Canonical home for reusable UI. Migrated 2026-09-18 from `src/app/components/*`
with **zero behavior change**: every old import path still works via a compat
shim in `src/app/components/<name>/<file>.ts` that re-exports the canonical
module. New code must import from `@shared` barrels or the canonical paths.

- `atoms/` — pure presentational primitives: breadcrumb, charts
  (donut/bar/line/skeleton), empty-state, error-state, global-loader,
  pagination, status-badge (new).
- `molecules/` — small functional combos: confirm/lost/sold/audit-trail/
  natural-search/wizard-search/error dialogs, client/seller selectors (unified
  behind `party-selector/PartySelectorBase`; both selectors, inputs, outputs
  and payload shapes preserved), group/user/negotiation forms,
  document-suggestion, property-search filter bar.
- `organisms/` — complex stateful blocks: header, sidebar, notifications,
  deal/lead/visit/property forms, document-manager, document-upload-form,
  property-import-dialog, lead-workflow, marketing-generator.
- `templates/` — layout documentation (routes compose the UI; see README).
- `utils/` — pure consolidated helpers (format, status, csv). Adopted via
  thin delegating wrappers in `crm`, `deals` (CSV escaping) and `dashboard`
  (compact currency + status classes); remaining page-local variants with
  divergent semantics (e.g. LBP support) were deliberately left untouched.

Deliberately NOT abstracted (would worsen the architecture):
client-selector ≃ seller-selector unification, document-suggestion ⊂
document-upload-form merge, kanban/data-table super-organisms, style dedupe
of the 3103-line global stylesheet — all deferred; each needs behavior-proof
work beyond a safe reorganization. Backend (`realedge-frontend/`, Express)
has no UI and is out of scope for Atomic Design; it was not touched.
