# Plan — Live chat redesign + position swap + admin show/hide

## Problems observed
1. **Post-name live chat UI is plain.** After a guest enters their name, the widget shows only an empty thread + input. The user wants the polished WhatsApp-style interface (welcome bubble, preset topic buttons, mic + send, header with avatar/online dot) — see uploaded screenshot.
2. **Positions are wrong.** WhatsApp widget is bottom-right, live chat is bottom-left. The user wants **live chat at WhatsApp's exact bottom-right spot**, and **WhatsApp moved above it** (stacked vertically on the right).
3. **No admin control.** Both widgets are hard-mounted in `Layout.tsx`. The user wants to show/hide each from the admin panel.

## Changes

### 1. Database (migration)
Add two flags to `site_settings`:
- `live_chat_enabled boolean not null default true`
- `whatsapp_enabled boolean not null default true`

(Already publicly readable; admin-only update via existing RLS.)

### 2. `SupportChatWidget.tsx` — full visual rebuild of the chat panel
After the guest submits name/email, replace the current bare thread with a WhatsApp-style layout (matches uploaded reference):
- Header: round avatar with headset icon, "AuraTrad.Ai Support", green "Online · replies in minutes", close X.
- Welcome bubble: "👋 Hi there! I'm here to help with deposits, withdrawals, AI bot issues or any account question. Pick a topic, type, or tap the mic to speak."
- Four preset topic buttons (same labels as WhatsApp widget) — clicking sends that text as the first user message in the live thread (not WhatsApp).
- Once a real conversation has messages, presets collapse and the thread renders as today.
- Input row: text input + mic button (Web Speech API, same logic as WhatsApp widget) + circular green send button.
- Footer: "Live chat with a real agent" (replaces WhatsApp-only footer).
- Keep all existing realtime, localStorage, unread-badge behavior.

### 3. Position swap (`Layout.tsx`)
- **Live chat launcher** → `bottom-5 right-5` (was bottom-left).
- **WhatsApp launcher** → `bottom-24 right-5` (stacked above live chat).
- Open panels anchor to the right and stack so they don't collide (live-chat panel `bottom-24 right-5`, WhatsApp panel `bottom-44 right-5`).
- Remove the left-side positioning from `SupportChatWidget` and the bottom-right hardcode from `WhatsAppWidget` — move position into props or wrapper divs so `Layout.tsx` controls placement.

### 4. Admin show/hide controls
Add a new **"Support widgets"** card to the admin Settings tab (`src/routes/admin.tsx`), next to WhatsApp number / deposit addresses:
- Two switches: "Show WhatsApp widget" / "Show Live Chat widget".
- Persists to `site_settings.whatsapp_enabled` / `live_chat_enabled` via the browser `supabase` client (admin RLS).

### 5. Frontend gating (`Layout.tsx`)
- Fetch `whatsapp_enabled, live_chat_enabled` from `site_settings` on mount (single query, cached in state).
- Conditionally render `<WhatsAppWidget />` and `<SupportChatWidget />`.
- Listen for a `novatrad:widget-flags-changed` custom event (dispatched by the admin toggle) so changes apply without reload for the admin's own session.

## Files touched
- `supabase/migrations/<ts>_widget_flags.sql` — add the two boolean columns.
- `src/components/SupportChatWidget.tsx` — rebuild chat UI post-name; accept optional position prop.
- `src/components/WhatsAppWidget.tsx` — accept position prop (defaults preserved) so Layout can stack it above live chat.
- `src/components/Layout.tsx` — load flags, conditional render, set positions (live-chat bottom-right, WhatsApp above).
- `src/routes/admin.tsx` — new "Support widgets" card with two switches.
- `src/integrations/supabase/types.ts` — auto-updated by migration.

## Out of scope
- No change to backend support functions (`startSupportChat`, `sendSupportMessage`).
- No change to WhatsApp deep-link / number config.
- No mobile-specific layout overhaul beyond the new stacked-right positioning.
