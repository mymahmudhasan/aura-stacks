## How admin reply works today

When a user opens the chat and sends their first message, the server fn `sendSupportMessage` auto-creates a linked support ticket (`source = 'live_chat'`) and mirrors every user message into both `support_messages` and `ticket_messages`.

Admins currently have two reply surfaces:

1. **Admin → Live Chat tab** (`AdminLiveChatTab.tsx`) — direct insert into `support_messages` + realtime broadcast to the user widget on channel `support:{conversationId}`. ⚠️ Does NOT write to `ticket_messages`, so the ticket thread looks one-sided.
2. **Admin → Tickets tab** (`replyToTicket` server fn) — inserts into `ticket_messages`, mirrors into `support_messages`, broadcasts to user. This is the complete path.

Result: replies work, but the two surfaces are inconsistent and confusing.

## Plan — unify admin reply so both surfaces stay in sync

### 1. Route Live Chat tab replies through `replyToTicket`
- In `AdminLiveChatTab.tsx`, when the admin sends a message:
  - Ensure the conversation has a `ticket_id` (load it; if missing — e.g. admin opens chat before user typed — call a new lightweight server fn `ensureChatTicket({ conversation_id })` that runs the same `ensureTicketForConversation` logic).
  - Call `replyToTicket({ ticket_id, body, author_name, author_id: adminUserId })` via `useServerFn`.
  - Remove the direct `supabase.from('support_messages').insert(...)` and manual broadcast — `replyToTicket` already mirrors + broadcasts.
- Pass the current admin's `auth.uid()` as `author_id` so the ticket message is correctly attributed.

### 2. Expose `ensureChatTicket` server fn
- Thin wrapper in `src/lib/support.functions.ts` that returns `ticket_id` for a given conversation, creating it if missing. Reuses existing `ensureTicketForConversation`.

### 3. Polish the Live Chat tab UX
- Show a small "Ticket #NV-xxx" chip in the thread header, linking to the Tickets tab (or just displaying the number) so admins know the linked ticket.
- Show unread indicator (last_message_at newer than locally seen) on conversations in the sidebar list.
- Optimistic message append on send (already partially there); keep the postgres_changes listener as the source of truth so admin's reply appears even when triggered via the Tickets tab.

### 4. Validation
- Send a message from a guest widget → confirm it appears in Live Chat tab AND Tickets tab thread.
- Reply from Live Chat tab → confirm it appears in the user widget AND in the linked ticket's `ticket_messages`.
- Reply from Tickets tab → confirm it appears in the user widget AND in Live Chat tab thread.
- Close conversation from Live Chat tab → verify status updates.

### Files to touch
- `src/components/admin/AdminLiveChatTab.tsx` — swap direct insert for `replyToTicket`, add ticket chip, fetch `author_id`.
- `src/lib/support.functions.ts` — add `ensureChatTicket` server fn.

No database migration needed; schema already supports this (`support_conversations.ticket_id`, `tickets.source_conversation_id`).