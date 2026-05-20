## Goal
Verify every link works, audit UI/UX of all pages (including user + admin dashboards), and fix issues as I go.

## Link audit (already done in exploration)
All 23 distinct `<Link to="...">` targets in the codebase resolve to existing route files — no broken internal links:
`/`, `/about`, `/admin`, `/admin/operations`, `/affiliate`, `/ai-trading`, `/contact`, `/dashboard`, `/deposit`, `/faq`, `/forgot-password`, `/login`, `/mining`, `/privacy`, `/referrals`, `/register`, `/settings`, `/staking`, `/support`, `/terms`, `/transactions`, `/wallet`, `/withdraw`.

Still to verify at runtime: 404s, console errors, broken buttons / dead actions, anchor links.

## Pass 1 — Public pages (live in browser, desktop + mobile)
For each of: `/`, `/mining`, `/staking`, `/ai-trading`, `/affiliate`, `/about`, `/faq`, `/support`, `/contact`, `/terms`, `/privacy`, `/login`, `/register`, `/forgot-password`.

For each page I will:
- Load it, screenshot desktop (1280) + mobile (390)
- Check console + network for errors
- Click every visible link / CTA, verify it goes somewhere sensible
- Note UI issues: horizontal scroll, overflow, clipped text, broken images, contrast, alignment, mobile layout breaks, dead buttons

Known issue already spotted at 889px viewport: home page has horizontal scroll (ticker / hero overflow).

## Pass 2 — User dashboard (auth-gated)
Routes: `/dashboard`, `/wallet`, `/deposit`, `/withdraw`, `/transactions`, `/settings`, `/referrals`.

Approach:
- If you can log me in (just sign into the preview in the browser, then tell me), I'll test these live click-by-click.
- Otherwise I'll do a static review: read each route file, trace every button's handler, verify server-fn calls, check loading/error/empty states, check mobile layout via code.

## Pass 3 — Admin dashboard
Routes: `/admin` (1516 lines, many tabs), `/admin/operations`, `/admin.reset-password`, `/admin.sms-test`.

Same approach — live click-through if you're logged in as admin, otherwise static review of each tab + action.

## Pass 4 — Fixes
I'll fix everything I find in priority order:
1. Broken links / runtime errors / dead buttons (functional bugs)
2. Mobile layout breaks, horizontal scroll, overflow
3. Contrast / clipped text / spacing
4. Polish (alignment, hover states, empty states)

Each fix is a small targeted edit — no rewrites of working code.

## Deliverable
- A short findings list per page (what was wrong, what I fixed)
- Any items I couldn't fix without your input (e.g. business-logic questions) flagged separately

## One thing I need from you
The preview browser I use is a separate session from yours — it's not logged in. To live-test `/dashboard` and `/admin`, please **sign in once in the preview window on your side** (any account for dashboard, admin account for admin pages). If you'd rather skip that, say so and I'll do those two passes as static code review only.
