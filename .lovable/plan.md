# Functional Offers System

Turn the 4 marketing cards (Welcome APY Boost, VIP Lock, Double Daily Rewards, $25 Referral Bonus) into real, claimable offers that actually change how user profit is computed and credited.

## What each offer will do

| Offer | Promise | Mechanic |
|---|---|---|
| +3% Welcome APY Boost | First-time stakers get +3% APY for 30 days on any plan | Auto-claimed at signup; daily earnings cron adds `boost_pct` on top of plan APY for 30 days from first stake |
| VIP $5k+ → 42% APY | Lock $5,000+ for 12 months at 42% APY | Creates a special VIP staking investment (12mo, 42% APY) when user invests ≥$5,000 from offer CTA |
| Double Daily Rewards | 2× daily payouts for first 14 days, stackable | Multiplier of 2 applied to daily earnings for 14 days after activation |
| $25 Bonus per Friend | $25 USDT credited when referred friend stakes $500+ | Auto-creates a `pending` admin-approval bonus when a referred user's first stake ≥$500; admin approves → credits wallet |

## Database

New tables (migration):
- **`offers`** – catalog (slug, title, description, badge, type, effect_json, starts_at, ends_at, is_active, sort). Seeded with the 4 offers. Public read; admin write.
- **`user_offers`** – per-user claim ledger (user_id, offer_slug, status: active/expired/used/pending_approval, claimed_at, expires_at, applied_to_investment_id, payload_json). RLS: user reads own; admin all.
- **`referral_bonuses`** – pending/approved $25 referral payouts (referrer_id, referred_id, trigger_investment_id, amount, status, approved_by, paid_at). Admin approve → inserts wallet transaction + credits balance.

Trigger update:
- Extend `handle_earning_insert` (or add a helper used by the cron / earning insertion) to multiply by active `double_rewards` and add `welcome_boost` extra-APY component for that user when crediting earnings.
- New trigger on `investments` insert: if user was referred and amount ≥ $500 and no prior approved investment exists, insert a `pending` row in `referral_bonuses`.

## Server functions (`src/lib/offers.functions.ts`)

- `listOffers` – public list active offers (homepage/staking page).
- `getMyOffers` – auth: current user's offer states + computed multipliers.
- `claimOffer({ slug })` – auth: claim if eligible; sets expiry per offer (30d / 14d / lifetime).
- `goVipInvest({ amount })` – auth: validates ≥ $5,000, opens 12-mo investment at 42% APY tied to VIP offer.
- `adminListReferralBonuses`, `adminApproveReferralBonus({ id })`, `adminRejectReferralBonus({ id })` – admin manual approval.
- `adminUpsertOffer`, `adminToggleOffer` – admin CRUD.

## UI changes

- **Homepage / staking offers section** – cards become live, driven by `listOffers` + `getMyOffers`. CTA states: Claim / Claimed (3d 14h left) / Eligible at $5k / Already used. Click triggers `claimOffer` (or opens VIP invest modal / referral link copy).
- **Invest/staking flow** – when computing projected/live earnings, multiply by `getMyOffers` multipliers; show a small "Boost active: +3% APY · 12d left" pill on the timeline.
- **Dashboard** – new "Your active offers" banner: claimed offers, expiry countdown, effective APY after boosts, pending referral bonuses.
- **Admin panel** (`src/routes/admin.tsx` new tab "Offers") – toggle/edit offers, review pending referral bonuses with Approve / Reject buttons.

## Profit calculation rule

```
effective_daily_rate = plan.daily_rate
  + (welcome_boost_active ? 0.03/365 : 0)
effective_daily_amount = investment.amount * effective_daily_rate
  * (double_rewards_active ? 2 : 1)
```

Applied wherever daily earnings are computed (existing earning insert path + UI projections in `StakingTimeline`, `LiveEarningsTicker`, dashboard).

## Out of scope

- No automatic referral bonus payouts (manual admin approval per your choice).
- No payment processor changes.
