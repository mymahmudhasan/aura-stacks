# Wipe demo data — keep only admin `tshirtkella@gmail.com`

Goal: remove every other user and all transactional/demo data from the database, leaving a clean production-ready backend with only one admin account.

## Users currently in the system

| Email | Role | Keep? |
|---|---|---|
| tshirtkella@gmail.com | admin + user | KEEP (sole admin) |
| admin@novatrad.ai | admin + user | delete |
| protapc2@gmail.com | admin + user | delete |
| protapc9@gmail.com | user | delete |
| protapc17@gmail.com | user | delete |
| anutapchandradas.2000@gmail.com | user | delete |
| bappyd549@gmail.com | user | delete |
| mymahmudhasan2000@gmail.com | user | delete |

After cleanup: 1 user (`tshirtkella@gmail.com`) with `admin` role only.

## What gets wiped (all rows, not just for deleted users)

Transactional / demo content — full table truncate:
- `wallet_transactions`, `deposits`, `withdrawals`
- `investments`, `investment_earnings`
- `referrals`, `referral_earnings`, `referral_bonuses`
- `welcome_bonuses`, `user_offers`, `payout_runs`
- `support_messages`, `support_conversations`
- `ticket_messages`, `tickets`
- `phone_otp_codes`

Kept intact:
- `investment_plans`, `offers`, `payment_providers`, `payout_config`, `site_settings`, `support_bot_replies` (configuration, not user data)
- `profiles`, `customers`, `user_roles` rows for tshirtkella only
- Admin's `customers` row reset: balance/deposited/withdrawn = 0, account_type = `real`, status = `active`

## Auth users

`auth.users` rows for the 7 deleted accounts will be removed via a `SECURITY DEFINER` cleanup function (the migration runner cannot delete from `auth` directly). Deleting from `auth.users` cascades to the public tables that reference `user_id`.

## Steps

1. Run a migration that:
   - Truncates the transactional tables listed above.
   - Deletes `user_roles`, `customers`, `profiles` for all non-admin users.
   - Defines + executes a one-shot SECURITY DEFINER function that deletes the 7 unwanted rows from `auth.users`, then drops the function.
   - Resets the admin's `customers` row to zeroed real-account state.
2. Verify counts: 1 row each in `profiles`, `customers`, `user_roles`; 0 rows in transactional tables.

## Notes

- This is destructive and irreversible. All historical demo deposits/investments/tickets are gone.
- The admin keeps their existing password and session — no re-login needed.
- The published landing-page "live ticker" will show no active investments until real users sign up and invest.
