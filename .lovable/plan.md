## Goal
The current dashboard stacks too many banners, stat tiles, and panels in a single long column — it feels noisy and overwhelming. Redesign it as a calm, scannable layout with a clear hero, grouped sections, and progressive disclosure. Pure UI refactor of `src/routes/dashboard.tsx` — no backend, data, or business-logic changes.

## New layout (top to bottom)

```text
┌──────────────────────────────────────────────────────────────┐
│  HERO CARD (full width, gradient)                            │
│  Avatar  Welcome, Name   #ID  · Demo/Live pill               │
│  ── Portfolio Equity (big number, live tick) ──              │
│  Balance · Earnings today · Lifetime · Pending  (4 mini KPIs)│
│  [Deposit] [Withdraw] [Invest] [Referrals]  ⟳ 🔔 ⚙          │
└──────────────────────────────────────────────────────────────┘

[ Onboarding strip ] (only if incomplete — single row, dismissible feel)
[ Featured active package countdown ] (only if exists — unchanged logic)
[ Binance UID strip ] (compact, collapsible — only red/expanded when missing)

┌─ Tabs: Overview | Investments | Activity | Promotions ─┐
│                                                         │
│  Overview  → 2-col: Quick Invest  |  Recent Activity   │
│  Investments → Active packages grid                     │
│  Activity → Full transactions list                      │
│  Promotions → Welcome bonus, 25% deposit, offers banner │
└─────────────────────────────────────────────────────────┘
```

## Concrete changes in `src/routes/dashboard.tsx`

1. **Hero card** — Replace the current "Welcome back" header + 5-tile stat grid with a single gradient hero card:
   - Left: avatar circle (initials), name, `#ID`, Demo/Live pill.
   - Center/large: **Portfolio Equity** as the headline number (3xl/4xl gradient text), small "Live" pulse dot.
   - Row of 4 compact KPIs underneath: Balance · Earnings Today · Earnings + Invested · Pending Withdrawals. No icons-as-big-boxes — just label + value, tight.
   - Right/below: primary action row — Deposit (gold), Withdraw, Invest (jump to Quick Invest), Referrals + icon-only Refresh / Bell / Settings.

2. **Move promotional banners out of the top fold**:
   - Welcome bonus banner, 25% deposit gold banner, and `<OffersBanner />` move into a new **Promotions** tab. Keep a small "🎁 25% bonus active" chip in the hero so users still notice.
   - Demo-account nudge stays near top but as a slimmer single-line strip.

3. **Onboarding (2 steps)** — keep logic, restyle as a single horizontal pill row instead of a full card when only 1 step remains.

4. **Featured active package countdown** — keep as-is (already nice), but only render when `featured` exists AND user is on the Overview tab.

5. **Binance UID strip** — collapse into a one-line compact bar by default when UID is set ("Binance UID · 28491… ✎"). Only expand to the current full explainer card when UID is missing (destructive state).

6. **Tabs section** (new) — Add a `Tabs` component (shadcn `@/components/ui/tabs`) with 4 panels:
   - **Overview**: 2-column grid → left = Quick Invest card (existing `QuickInvestForm` inside styled wrapper), right = Recent Activity (existing list, last 6).
   - **Investments**: Active investments list (move existing `activeInvs` rendering here; if currently empty render empty-state CTA to /mining).
   - **Activity**: Full `txns` table (first 25), with link to /transactions for all.
   - **Promotions**: WelcomeBonusBanner + 25% deposit card + OffersBanner stacked.

7. **Footer CTAs** — Referral dashboard card + "Discover new plans" CTA stay at the very bottom, unchanged.

8. **Stat component** — keep `Stat` helper but make a smaller `MiniKpi` variant (no big icon tile, just label + value + tiny trend) for the hero KPI row. Remove the 5-up `GlassCard` grid that currently sits below the action row.

## Visual polish (token-only, no new colors)
- Hero uses existing `var(--gradient-aurora)` border with `bg-background/85 backdrop-blur-xl` panel — matches featured-package card style for visual cohesion.
- Use `var(--gradient-primary)` for primary numbers, `text-success` for positive deltas, existing `glow-primary` / `glow-gold` on CTAs.
- Increase whitespace: section gaps `gap-6` → `gap-8`; remove redundant borders inside cards.
- Live-pulse green dot next to "Portfolio Equity" to reinforce the always-updating feel.

## What is NOT changing
- Data loading (`load`, `getMyWallet`, etc.), polling, plan-rate fetching, accrual math.
- `RequirePhoneVerified` wrapper, route guards, redirects.
- `QuickInvestForm`, `WelcomeBonusBanner`, `OffersBanner`, referral card — reused as-is.
- All other routes and components.

## Result
A dashboard with one obvious focal point (Portfolio Equity), one obvious action row, and the rest organized under tabs — much less to parse on first glance, but every existing feature still reachable in one click.
