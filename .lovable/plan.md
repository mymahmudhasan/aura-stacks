## Change

In `src/routes/dashboard.tsx`, the hero "Portfolio Equity" amount currently renders with 2 decimals (e.g. `$101.01`). Change it to 6 decimals so it ticks live like the "+$1.010124 today" delta below it (e.g. `$101.010124`).

### Edit
- Line 251: `{fmtUsd(portfolioEquity, 2)}` → `{fmtUsd(portfolioEquity, 6)}`

No other numbers, KPIs, transactions, or balance displays are changed.