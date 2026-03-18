---
title: Portal UI Design Principles
description: Standardized typography, layout, states, and token usage for BridgeIT /portal.
---

## Purpose
This document defines the UI rules that should be followed across the BridgeIT authenticated portal (`/portal`) to keep pages consistent, accessible, and theme-correct.

## Theme Tokens (non-negotiable)
Prefer semantic theme tokens over hard-coded Tailwind color classes.

Use:
- `bg-background`, `text-foreground`
- `bg-card`, `text-card-foreground`
- `border-input`, `bg-muted`, `text-muted-foreground`
- `bg-primary`, `text-primary-foreground`
- `bg-secondary`, `text-secondary-foreground`
- `bg-destructive`, `text-destructive-foreground`
- `focus-visible:ring-ring` (via existing UI primitives)

Avoid (unless there is no semantic equivalent):
- `text-gray-*`, `bg-gray-*`, `text-blue-*`, `bg-blue-*`, `text-red-*`, `bg-red-*`, etc.

## Spacing & Layout Rhythm
Pages inside the portal should rely on the shared container:
- Outer padding: `PageContainer` (`components/layout/page-container.tsx`)

Inside pages:
- Use `space-y-*` for vertical rhythm between sections.
- Prefer `gap-*` over manual margins for grids and flex rows.
- For list/table pages, standardize to a top bar:
  - Title on the left
  - Primary actions on the right (Filter, Export, Columns, Add where applicable)

## Typography Scale
Use a consistent heading hierarchy:
- Page title: `text-2xl md:text-3xl font-semibold tracking-tight` (or just `text-2xl ...` when needed)
- Section title inside cards: `text-lg md:text-xl font-semibold` (use `CardTitle` or the portal heading component)
- Supporting text: `text-sm text-muted-foreground`
- Table cells: `text-sm` (via `Table` primitives)

Rules:
- Do not mix different title sizes ad-hoc across similar list pages.
- Prefer shared portal heading components over raw `text-*` classes.

## Cards
Use the shared card primitives:
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`

Rules:
- Keep header structure consistent: `CardHeader` then `CardContent`.
- Avoid re-implementing card borders/backgrounds with bespoke classes.

## Buttons
Use the shared button variants (`components/ui/button.tsx`):
- Primary: `variant="default"`
- Secondary: `variant="secondary"`
- Outline: `variant="outline"`
- Ghost: `variant="ghost"`
- Link: `variant="link"`
- Destructive: `variant="destructive"`

Rules:
- For “primary action in a sheet”: use `variant="default"` with `className="w-full"` when needed.
- For “secondary/clear action”: use `variant="link"` or `variant="outline"` consistently across all filter sheets.

## Forms & Filter Sheets
All filter sheets should share:
- A standardized sheet width: `w-full sm:w-[400px]`
- Consistent field layout:
  - `Label` + `Input`/`Select` with `space-y-1.5`
  - Use `grid` for responsive 2-column field sets where it improves scanning
- A sticky footer action area on long filter forms:
  - Primary button: `Find <resource>`
  - Secondary button: `Clear` with a FilterX icon

Implementation guidance:
- Use `PortalFilterSheet` for the sheet shell + footer.
- Keep specific fields inside the page-specific filter components.

## Tables & List States
Table/list pages should use `components/custom-table.tsx` as the standard wrapper.

Loading:
- Skeleton rows while loading.

Empty:
- Exactly one pattern: `No results.` (including punctuation).

Rules:
- Avoid writing new empty/loading strings inside page wrappers when `CustomTable` already provides them.

## Charts / Analysis Pages: Standard State Trio
Analysis pages (charts, dashboards, chart-based reports) should follow the same trio:
- Error: `Alert variant="destructive"` + retry button
- Loading: chart skeleton/placeholder
- Empty: icon + message + “Clear Filters” or “Retry” as a small outline button

Implementation guidance:
- Prefer `PortalStates` helpers to avoid one-off UI.

## Dark Mode Correctness
The portal (`/portal`) is theme-gated so the dark class is applied only outside `/portal` routes.
Still, keep all UI token-based so it remains readable if theme behavior changes.

Rules:
- Do not rely on hard-coded `text-gray-*` for readability.
- Avoid inline colors without ensuring text contrast.

## Cursor Guidance (rules enforced by repo)
- All new portal UI work should reference and reuse `components/portal/*` and UI primitives.
- When you need a new pattern, add it to `components/portal` and then use it everywhere.

