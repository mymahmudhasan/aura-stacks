## Goal

Replace the hardcoded bot replies in the support chat widget with admin-editable presets, manageable from the backend (Admin → Live Chat tab).

## Backend

1. **New table** `support_bot_replies`:
   - `id uuid pk`
   - `keywords text[]` — match if any keyword appears in user message (case-insensitive). Empty/null = fallback.
   - `reply text` — the auto-reply body
   - `is_fallback boolean default false` — used when nothing else matches
   - `is_active boolean default true`
   - `sort_order int default 0`
   - `created_at`, `updated_at`
   - RLS: admins manage all; `SELECT` allowed to `anon` + `authenticated` (so the widget can read them) limited to `is_active = true`.
2. **Seed** the existing 8 presets (deposits, bot, mining, human, kyc, login, affiliate, greeting) + one fallback row, so behavior matches today on first run.

## Widget (`SupportChatWidget.tsx`)

- On mount, fetch active rows from `support_bot_replies` once.
- Replace `botReplyFor()` with a function that scans fetched rows in `sort_order`, returns the first whose keyword list matches the user text. If none match, return the active fallback row's reply (or null if none).
- Keep `MAX_BOT_REPLIES = 2` and the "stop once a human replies" logic unchanged.

## Admin UI (`AdminLiveChatTab.tsx`)

- Add a collapsible "Auto-reply presets" panel above the conversation list (or as a small button that opens a modal).
- Panel shows a list of rows with: keywords (comma-separated input), reply (textarea), is_fallback toggle, is_active toggle, sort order, Save / Delete.
- "Add preset" button inserts a new blank row.
- All edits done via direct supabase calls (RLS already restricts to admins).

## Notes

- No edge function needed; widget reads with the anon client (RLS allows public SELECT on active rows).
- Empty/no presets = bot silent; widget keeps working normally with just human replies.
