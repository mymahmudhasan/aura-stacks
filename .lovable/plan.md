## Issues found

**1. Stuck on `/login` after sign-in (your screenshot)**
You are signed in as `protapc9@gmail.com` (a regular demo user, not admin) but the page is `/login`. The login screen never redirects already-authenticated visitors away — there's no auth check on mount, only inside the form's submit handler. So any time a logged-in user lands on `/login` (via the nav, back button, or a stale tab), they see the form forever.

**2. `/admin` silently signs out non-admins**
In `src/routes/admin.tsx`, if the visitor is not an admin, the code runs `supabase.auth.signOut()` and pushes them to `/dashboard`. Since they're now logged out, `/dashboard` bounces them to `/login` — which then sticks (see issue 1). That's exactly the loop you hit. It should just redirect, not sign out.

**3. Admin dashboard has no Deposits/Withdrawals tab**
`/admin` only has tabs: Overview, Customers, Tickets, Payouts, Settings. Deposits and withdrawals live on a separate route `/admin/operations`, but nothing on the admin page links there. RLS is fine (admins have full ALL access via `has_role`), the data is just hidden in the UI. There is 1 pending deposit (protapc2) and 1 pending withdrawal (anutap) in the DB right now — admins just can't reach the screen.

## Fix plan

**A. `src/routes/login.tsx`** — auto-redirect when already signed in
- On mount, call `supabase.auth.getSession()`. If a session exists, route admins to `/admin` and everyone else to `/dashboard` (reuse the existing `routeAfterAuth` helper).
- Also subscribe to `onAuthStateChange` so a fresh sign-in (Google redirect back) routes immediately.

**B. `src/routes/admin.tsx`** — stop force-signing-out non-admins
- Remove the `supabase.auth.signOut()` call in the non-admin branch; just `navigate({ to: "/dashboard" })`.
- Add a sixth tab **"Operations"** to the nav that links to `/admin/operations` (or render the existing Operations component inline). Showing it as a top-level admin tab is the simplest fix and matches the other tabs.
- Surface a small KPI on the Overview tab: pending deposits + pending withdrawals counts, each linking to Operations, so admins immediately see there's something to review.

**C. Quick sanity confirmation after the fix**
- Sign in as `tshirtkella@gmail.com` (admin) → should land on `/admin`, see "Operations" tab, click it, see the pending deposit from `protapc2` and the pending withdrawal from `anutap`, and be able to Approve / Mark paid.
- Sign in as `protapc9@gmail.com` (demo user) → should land on `/dashboard` directly, no /login loop.

## Out of scope
- No DB/RLS migrations needed — policies already allow admin full access.
- No changes to the deposit/withdraw user flows.
