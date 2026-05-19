## Plan

### 1. Fix the admin account showing the user dashboard
- Confirm `tshirtkella@gmail.com` is treated as an admin in the app, not just in the database.
- Update the signed-in account menu so admins get an **Admin panel** link instead of being pushed toward the user dashboard.
- Update the `/dashboard` route guard so admin users are redirected to `/admin` when they land on `/dashboard`.
- Keep the existing server-side role table pattern; no client-side/localStorage admin checks.

### 2. Make admin ticket tab functional
- Clean up the admin page rendering bug where `PackagesTab` and `SettingsTab` are mounted twice.
- Improve the Tickets tab so admins can reliably load, search, sort, and update ticket status.
- Add a ticket details/thread view using the existing `ticket_messages` table so ticket replies are visible and usable, not just a static ticket list.
- Add admin reply support from the Tickets tab, inserting staff replies into `ticket_messages` and updating the ticket timestamp/status.

### 3. Generate support tickets from live chat
- Add safe linking fields between live chat and tickets:
  - `support_conversations.ticket_id`
  - optionally `tickets.source` / `tickets.source_conversation_id` for traceability.
- When a user starts or sends the first live chat message, automatically create a ticket with the guest name/email and first message.
- Keep each live chat conversation tied to one ticket so repeated messages do not create duplicate tickets.
- If a guest did not provide email, use a safe placeholder only for the internal ticket record while preserving the guest name.

### 4. Backend/RLS and realtime safety
- Use a database migration for new columns/functions/triggers and keep admin-only management policies intact.
- Use TanStack server functions for chat/ticket creation, with admin server access only inside server functions.
- Preserve existing guest live-chat behavior and admin live-chat realtime behavior.

### 5. Validation
- Check database rows for the admin user, live-chat conversations, and generated tickets.
- Verify admin navigation sends the admin to `/admin`, not `/dashboard`.
- Verify a live chat creates exactly one ticket and that the admin Tickets tab can open/update/reply to it.