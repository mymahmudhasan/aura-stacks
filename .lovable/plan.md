## Goals

1. Reward first-time depositors with an automatic 25% welcome bonus (when first deposit ≥ $50) and notify them with a welcome message explaining the bonus.
2. Make the active-investment countdown + per-second earnings ticker (cents accruing live) **visible to other users** as a public live feed — not only on the owner's dashboard.
3. Fix the user dashboard's **Quick Invest** so packages added/edited in the admin panel actually appear there (currently hardcoded).

---

## 1. First-Deposit Welcome Bonus (25% on $50+)

**Database**
- New table `welcome_bonuses` (user_id unique, amount, source_deposit_id, granted_at) — so the bonus can only ever be granted once per user.
- Update `handle_deposit_status()` trigger:
  - On deposit approval, check if this is the user's **first ever approved deposit** AND `amount >= 50`.
  - If yes: compute `bonus = amount * 0.25`, insert into `welcome_bonuses`, insert a `wallet_transactions` row (`kind='bonus'`, notes = "Welcome bonus — 25% of your first deposit"), and add `bonus` to `customers.balance`.
- The bonus is atomic with the deposit credit (same trigger, same transaction).

**Dashboard UI**
- New top banner: when a `wallet_transactions` row of kind `bonus` exists with notes starting "Welcome bonus", show a celebratory modal/banner once: *"Welcome! We just credited $X to your balance — that's your 25% first-deposit bonus."* Dismiss persisted via `localStorage` keyed by user id.
- Replace the current "25% Deposit Bonus" generic banner with: still shown to users with no deposits yet (as a promo CTA), and replaced by the welcome message for the bonus recipient.

---

## 2. Public Live Earnings Ticker

Currently `dashboard.tsx` shows the owner their featured package countdown + per-second profit accrual. The user wants this visible to others (social proof on the landing page).

**Server function (public, anonymized)**
- New `listLiveActiveInvestments` in `src/lib/wallet.functions.ts` using `supabaseAdmin`, returning the **30 most recent active investments**: `{ id, service, plan_name, amount, started_at, ends_at, masked_handle }` where `masked_handle` = first 2 chars of full_name + `***` (e.g. "Jo***"). No emails, no user ids.

**New component `LiveEarningsTicker`**
- Polls `listLiveActiveInvestments` every 30s.
- Renders a horizontally scrolling marquee of cards. Each card shows:
  - Masked user handle + service icon + plan name
  - Live countdown (days/hours/min/sec) until `ends_at`
  - Live earnings `+$X.XXXXXX` updated every second using the same `dailyRateFor` formula already used in dashboard
  - Progress bar
- Place on landing page (`src/routes/index.tsx`) under the hero, replacing/augmenting `LiveDeposits`.

**Fix existing SSR hydration issue**
- `LiveDeposits` and the new ticker currently render time-based numbers at SSR causing the hydration mismatch shown in runtime errors. Gate all `Date.now()`-driven renders behind a `mounted` state (`useEffect(()=>setMounted(true),[])`) so the server emits a static placeholder.

---

## 3. Dashboard Quick Invest → DB-driven packages

`src/components/QuickInvestModal.tsx` currently hardcodes the `SERVICES` package map, so admin-added/edited packages don't show.

- Refactor `QuickInvestForm` to fetch all active plans from `investment_plans` via existing `listPlans({ service })` server fn on mount (once per service tab switch, cached in state).
- Map DB row → existing `Pkg` shape:
  - `min`/`max` ← `min_amount`/`max_amount`
  - `roi` label ← `daily_rate_pct` ("X% / day") for ai_trading/mining or `apy_pct` ("X% APY") for staking; fallback to `total_roi_pct`
  - `duration` ← `${duration_days}d`
  - `tag` ← `badge`, `hot` ← `is_popular`
- Show loading skeleton + empty/error states using the existing `PlansState` components.
- Update `dailyRateFor` in `dashboard.tsx`: instead of the hardcoded plan-name map, fetch active plans once and look up `daily_rate_pct` / `apy_pct` by `plan_name`. Falls back to 1% if not found (legacy investments).

---

## Files

**Migration**
- Create `welcome_bonuses` table + RLS (admin manage; user view own) + updated `handle_deposit_status()` function.

**Server functions** (`src/lib/wallet.functions.ts`)
- Add `listLiveActiveInvestments` (public, anonymized).

**New components**
- `src/components/LiveEarningsTicker.tsx`
- `src/components/WelcomeBonusBanner.tsx`

**Edits**
- `src/components/QuickInvestModal.tsx` — fetch plans from DB.
- `src/routes/dashboard.tsx` — DB-backed rate lookup, welcome bonus banner, fix featured-card hydration gate.
- `src/routes/index.tsx` — mount `LiveEarningsTicker`.
- `src/components/LiveDeposits.tsx` — gate time-driven render to fix hydration mismatch.

## Out of scope
- Bonus tiers other than 25% / $50.
- Showing user real names on the public ticker (always masked).
- Notifying users by email about the bonus (in-app only).
