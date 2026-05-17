# Plan — Admin: Deposit destination addresses

## Goal
Let admins configure the wallet addresses / Binance Pay ID where users send deposits, directly from the admin panel. These values already live in `site_settings` (`usdt_trc20_address`, `usdt_bep20_address`, `usdt_erc20_address`, `binance_pay_id`) and are read by `getDepositSettings` for the user-facing deposit page. Today they can only be edited via the database — there is no UI.

## Scope
Add a single new admin card next to the existing **WhatsApp Support Number** card on the admin Settings tab.

### UI: `DepositAddressesSettings` (new component in `src/routes/admin.tsx`)
- Four inputs:
  1. USDT · TRC20 (Tron) address
  2. USDT · BEP20 (BSC) address
  3. USDT · ERC20 (Ethereum) address
  4. Binance Pay ID
- Per-field format validation (matches what `createDeposit` already enforces for the *sender* side, so deposits the user submits will pass validation):
  - TRC20: `^T[a-zA-Z0-9]{33}$`
  - BEP20 / ERC20: `^0x[a-fA-F0-9]{40}$`
  - Binance Pay ID: `^[a-zA-Z0-9_-]{3,64}$`
- Empty value = "not configured" (allowed; the deposit page already shows "Not configured — contact support" when empty).
- Single **Save** button, disabled until something is dirty and all non-empty fields pass validation.
- Copy-to-clipboard button per field for admin convenience.

### Data layer
- No schema change needed; `site_settings` row id=1 already has the columns and RLS already restricts updates to admins (`has_role(auth.uid(), 'admin')`).
- Use the existing browser `supabase` client (same pattern as `WhatsAppSettings`) — admin's session passes RLS.
- On load: `select usdt_trc20_address,usdt_bep20_address,usdt_erc20_address,binance_pay_id from site_settings where id=1`.
- On save: `update site_settings set ... where id=1`, converting empty strings to `null`.

### Wiring
- Mount inside the existing Settings tab grid, immediately above or below the `WhatsAppSettings` card, reusing `GlassCard` and the existing `onToast` helper for success/error messages.

## Files touched
- `src/routes/admin.tsx` — add `DepositAddressesSettings` component and mount it on the Settings tab.

## Out of scope
- No changes to `wallet.functions.ts`, `deposit.tsx`, or RLS — the rest of the stack already consumes these fields.
- No multi-network add/remove (set of four is fixed by current schema).
