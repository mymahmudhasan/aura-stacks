## Goal
Let logged-in users see their wallet, submit deposits (manual crypto or automated provider), enroll in AI Trading / Mining / Staking, and let the admin track everything and credit balances + earnings manually. No 3rd-party API is wired yet — the admin records that link in notes.

## What we already have
- `customers` table with `balance`, `total_deposited`, `total_withdrawn`, `binance_uid`, `binance_wallet_address`
- `user_roles` (admin role) + `has_role()` RLS helper
- Admin panel at `/admin` (overview / customers / tickets / payouts / settings)
- Dashboard at `/dashboard` showing mock balances/active investments

## New database tables

1. **`wallet_transactions`** — single source of truth for balance movement
   - kind: `deposit | withdrawal | earning | investment | refund | adjustment`
   - amount, currency (USDT default), status: `pending | approved | rejected | completed`
   - method: `manual_crypto | automated | admin`
   - tx_hash, from_address, provider_ref, notes
   - RLS: user reads own; admin all

2. **`deposits`** — extra context for user-submitted deposits
   - amount, network (TRC20/BEP20/etc), tx_hash, screenshot_url, status, transaction_id (→ wallet_transactions), admin_notes
   - Triggered approval: when admin sets status = approved, a trigger inserts/updates `wallet_transactions` (status=completed, kind=deposit) and bumps `customers.balance` + `total_deposited`

3. **`withdrawals`** — user request → admin manual payout
   - amount, destination (Binance UID / wallet), status: `pending | approved | rejected | paid`
   - On approval: deduct balance + bump `total_withdrawn` via trigger

4. **`investments`** — user enrollment in a service
   - service: `ai_trading | mining | staking`
   - plan_name, amount, status: `pending | active | completed | cancelled`
   - external_provider, external_ref, admin_notes (admin records which 3rd-party they routed it to)
   - started_at, ends_at
   - On admin "activate": deduct amount from `customers.balance` and write a `wallet_transactions` row (kind=investment)

5. **`investment_earnings`** — admin-credited earnings per investment
   - investment_id, amount, note, credited_at
   - On insert: credit `customers.balance` + write `wallet_transactions` (kind=earning)

6. **`payment_providers`** (admin-only) — config for automated deposit rails (NowPayments, etc.)
   - name, api_key (server-only), enabled, callback_secret

All tables: RLS — user sees own rows; admin full access. Balance mutations live in **triggers + SECURITY DEFINER functions** so user-side inserts can't directly inflate balance.

## Server functions (`createServerFn`, auth-protected)
- `getMyWallet` — balance, totals, recent transactions
- `getMyInvestments` — list with current status + earnings
- `createDeposit({ amount, network, tx_hash, screenshot_url })` — inserts pending deposit
- `requestWithdrawal({ amount, destination })` — inserts pending withdrawal (rejected if amount > balance)
- `createInvestment({ service, plan_name, amount })` — inserts pending investment
- `createAutomatedDepositIntent({ amount })` — server-side call to provider API (NowPayments) returning hosted checkout URL; provider chosen from `payment_providers`
- Public webhook: `src/routes/api/public/deposit-webhook.ts` — verifies HMAC, marks matching deposit `approved` (only used once you wire a provider; safe to ship dormant)

## UI changes

**User-facing**
- `/wallet` (new) — balance card, deposit / withdraw buttons, transaction history table
- `/deposit` (new) — tab UI: "Manual crypto" (show your USDT addresses + form for amount/network/tx hash/screenshot) and "Pay with card/crypto" (automated provider, hidden if none enabled)
- `/withdraw` (new) — amount + destination form, list of pending requests
- `/invest/$service` (new, 3 plans pages → reuse existing mining/staking/ai-trading routes) — wire "Invest now" buttons to `createInvestment`
- `/dashboard` — replace mock data with real `getMyWallet` + `getMyInvestments`

**Admin** (extend `/admin`)
- New tabs: **Deposits**, **Withdrawals**, **Investments**
- Each row: approve / reject / mark paid / add notes
- Investments row: editable "External provider" + "External ref" fields + "Credit earning" inline form (amount + note)
- Settings tab: manage `payment_providers` + USDT deposit addresses (stored in `site_settings`)

## Flow summary

```text
DEPOSIT (manual)
 user submits form → deposits(status=pending)
 admin clicks approve → trigger → wallet_transactions + customers.balance ↑

DEPOSIT (automated)
 user clicks pay → server fn calls provider, returns checkout URL
 user pays → provider webhook → /api/public/deposit-webhook → deposit approved → trigger fires

INVEST
 user picks plan → investments(status=pending) (balance not yet deducted)
 admin reviews, sets external_provider/ref, clicks activate → balance ↓, investment active
 admin credits earnings periodically → balance ↑, user sees in /wallet

WITHDRAW
 user requests → withdrawals(status=pending)
 admin sends from Binance manually → marks "paid" → balance ↓ + total_withdrawn ↑
```

## Out of scope (explicit)
- No automatic earnings cron — admin credits manually as you asked
- No real 3rd-party trading integration — admin records the link in `investments.external_ref`
- No KYC flow beyond existing phone verification

## Build order
1. Migration: 6 new tables + RLS + trigger functions
2. Server functions for user wallet/deposit/withdraw/invest
3. `/wallet`, `/deposit`, `/withdraw` pages + dashboard wiring
4. Admin tabs (deposits, withdrawals, investments)
5. Hook "Invest now" buttons on mining/staking/ai-trading pages
6. (Optional, later) Add a real automated provider when you pick one — the webhook route + `payment_providers` row is all that's needed.

Confirm and I'll implement in this order. Reply if you want to drop the automated-deposit pieces for now (we can ship manual-only and add automated later without schema changes).