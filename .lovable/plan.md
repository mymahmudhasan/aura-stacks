# Plan

## 1. Simplify onboarding checklist (dashboard header)

In `src/routes/dashboard.tsx`, reduce the 4-step onboarding to **2 steps**:

1. **Make first deposit** → `/deposit` (complete when `hasDeposit`)
2. **Choose an investment package** → `/mining` (complete when user has any active investment in mining, staking, or ai_trading)

- Remove the staking and AI trading steps and their icons/links.
- Recompute progress (`completed / 2`).
- Keep the auto-hide once both are done.
- Update the heading copy to "2 steps to get started".

## 2. Remember sender wallet address / Binance UID on deposit

Goal: On the deposit form, capture the user's **sender identifier** (wallet address for crypto networks, Binance UID for Binance Pay), validate the format, persist it to the customer profile, and pre-fill it next time.

### Schema (migration)

Add two nullable columns to `public.customers`:
- `last_sender_address text` — last on-chain sender address used
- `last_sender_network text` — which network it belongs to (TRC20 / BEP20 / ERC20)

`binance_uid` already exists on `customers` and is reused for the Binance Pay case.

### Server function changes (`src/lib/wallet.functions.ts`)

- Extend `createDeposit` input to require `from_address` (already accepted, but make required and validated per network):
  - TRC20: `^T[a-zA-Z0-9]{33}$`
  - BEP20 / ERC20: `^0x[a-fA-F0-9]{40}$`
  - BINANCE_PAY: 3–64 alphanumeric (treated as UID, not address)
- After inserting the deposit, use `supabaseAdmin` to update `customers`:
  - For crypto networks → set `last_sender_address` + `last_sender_network`.
  - For `BINANCE_PAY` → set `binance_uid` if empty/different.
- Extend `getMyProfile` selection (already returns `binance_uid`); add `last_sender_address` and `last_sender_network` to the returned shape.

### UI changes (`src/routes/deposit.tsx`)

- Add a required **"Your sending address" / "Your Binance UID"** input (label switches based on selected network).
- On mount, fetch profile (`getMyProfile`) and prefill:
  - If network is TRC20/BEP20/ERC20 and `last_sender_address` matches the network → prefill.
  - If network is BINANCE_PAY → prefill `binance_uid`.
- Show a small helper "Saved from your last deposit" badge when prefilled.
- Client-side regex validation mirroring the server schema before submit; show inline error.
- Pass `from_address` in `createDeposit({ data: { ... } })`.

### Technical notes

- No changes to RLS — update goes through `supabaseAdmin` (existing pattern in `updateBinanceUid`).
- `getMyProfile` already exists; just widen the select. No new route needed.
- Keep changes additive and backward compatible (columns nullable, old deposits unaffected).

## Files touched

- `supabase/migrations/<new>.sql` — add `last_sender_address`, `last_sender_network` to `customers`.
- `src/lib/wallet.functions.ts` — validate + persist sender, expose on profile.
- `src/routes/deposit.tsx` — new prefill input + validation.
- `src/routes/dashboard.tsx` — checklist reduced to 2 steps.
