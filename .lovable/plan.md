# Manage investment packages from the admin panel

Goal: let an admin add, edit, reorder, enable/disable, and delete packages for each service (AI Trading, Mining, Staking) directly from `/admin`, and have those packages drive the public pages and the Invest flow.

## 1. Database — new `investment_plans` table

Create one table that covers all three services (`service` column = `ai_trading | mining | staking`).

Columns:
- `service` — which service this plan belongs to
- `name` — plan name (e.g. "Mining Starter", "12 Months")
- `min_amount`, `max_amount` — investment range (USDT)
- `daily_rate_pct` — daily reward % (used for mining / ai_trading)
- `duration_days` — lock / contract length
- `total_roi_pct` — optional pre-computed ROI label
- `apy_pct` — used by staking
- `flex` — `Flexible` / `Fixed` (staking)
- `badge` — optional label like "Most popular", "VIP"
- `is_popular` — boolean for highlight styling
- `is_active` — soft-disable without deleting
- `sort_order` — display order

RLS:
- Public `SELECT` where `is_active = true` (so marketing pages work for logged-out visitors).
- Admin `ALL` via `has_role(auth.uid(), 'admin')`.

Seed: insert the current hardcoded plans from `mining.tsx`, `ai-trading.tsx`, `staking.tsx` so the live site looks identical right after migration.

## 2. Admin UI — new "Packages" tab

Add a `packages` tab to `src/routes/admin.tsx` next to Customers / Tickets / Payouts / Settings.

Layout:
- Sub-tabs: AI Trading · Mining · Staking
- Table of plans for the selected service with inline columns: name, range, daily/APY, duration, badge, active toggle, sort, actions
- Buttons: **Add plan**, **Edit** (row), **Delete** (row), drag-or-arrow reorder
- Modal form for add/edit with validation (Zod), Save calls server functions

## 3. Server functions

New file `src/lib/plans.functions.ts`:
- `listPlans({ service? })` — public read (used by marketing pages too)
- `adminListPlans()` — admin, includes inactive
- `createPlan(input)` — admin, inserts row
- `updatePlan({ id, patch })` — admin
- `deletePlan({ id })` — admin
- `reorderPlans({ ids })` — admin, bulk sort_order update

All admin functions use `requireSupabaseAuth` + an `assertAdmin` check via `has_role`, then `supabaseAdmin` for writes.

## 4. Public pages read from DB

Update:
- `src/routes/mining.tsx` — replace hardcoded `plans` with `useQuery(listPlans({ service: "mining" }))`
- `src/routes/ai-trading.tsx` — render a Plans section sourced the same way (currently has none — add one)
- `src/routes/staking.tsx` — replace hardcoded `tiers` with DB-driven plans (`service: "staking"`)

Each plan card keeps the existing visual style and wires `InvestButton` with `planName`, `minAmount`, `service` from the row.

## 5. Files touched

- migration: `investment_plans` table + RLS + seed
- new: `src/lib/plans.functions.ts`
- new: `src/components/admin/PackagesTab.tsx` (keeps `admin.tsx` from bloating further)
- edited: `src/routes/admin.tsx` (register tab)
- edited: `src/routes/mining.tsx`, `src/routes/ai-trading.tsx`, `src/routes/staking.tsx`

## Out of scope (ask if you want it)

- Per-plan images / icons upload
- Scheduling (auto-enable a plan at a future date)
- Promo / discount codes per plan

Approve this plan and I'll implement it end-to-end.
