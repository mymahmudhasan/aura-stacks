## Goal

Signed-in users should never see the "Your name / Email" form in the support chat widget. The widget should auto-start a conversation using their existing account info (profile name + auth email). The form stays only for anonymous visitors who haven't signed up.

## Changes — `src/components/SupportChatWidget.tsx`

1. On mount, check `supabase.auth.getUser()`.
   - If signed in: fetch display name from `customers` (or `profiles`) table; fall back to email local-part. Listen to `onAuthStateChange` to handle login/logout while widget is mounted.
2. If signed in AND no `stored` conversation in localStorage yet:
   - Automatically call `startSupportChat` with `guest_name = <user name>`, `guest_email = <user.email>`, `user_id = <user.id>`.
   - Save to localStorage and set `stored`, so the chat thread opens directly — no form shown.
3. Keep the existing name/email form path strictly for the not-signed-in case.
4. On sign-out, clear `LS_KEY` and `stored` so a different visitor doesn't inherit the previous user's thread.

## Notes

- No backend / SQL / RLS changes — `startSupportChat` already accepts `user_id`.
- Admin tab and ticket mirroring work unchanged.
