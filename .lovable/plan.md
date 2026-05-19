## Goal
Only Binance Pay (deposit) and Binance UID (withdraw) are active by default. Other methods — USDT TRC20, BEP20, ERC20 wallets, and on-chain wallet-connect pay — are hidden from users unless an admin turns them on.

## Database
Migration on `site_settings` (single row, id=1) — add toggle columns:
- `deposit_binance_pay_enabled` boolean default true
- `deposit_trc20_enabled` boolean default false
- `deposit_bep20_enabled` boolean default false
- `deposit_erc20_enabled` boolean default false
- `deposit_onchain_wallet_enabled` boolean default false  (one-click WalletConnect pay card)
- `withdraw_binance_uid_enabled` boolean default true
- `withdraw_wallet_address_enabled` boolean default false

RLS unchanged (public can SELECT, admins manage). No data changes elsewhere.

## Server functions (`src/lib/wallet.functions.ts`)
- Extend `getDepositSettings` SELECT to include the new toggle columns.
- In `requestWithdrawal` handler, validate that the chosen `destination_type` is enabled in `site_settings`; reject with a clear error otherwise.
- In `createDeposit` handler, validate that the chosen `network`/method is enabled; reject otherwise. (Defense-in-depth — UI also hides it.)

## Frontend — Deposit page (`src/routes/deposit.tsx`)
- Read toggles from settings.
- Build the `NETWORKS` list dynamically — only include entries whose toggle is `true`. Default-select the first enabled one (Binance Pay when only it is on).
- Hide the entire `WalletPayCard` (one-click on-chain) when `deposit_onchain_wallet_enabled` is false.
- If no networks are enabled, show a friendly "Deposits temporarily unavailable — contact support" state.

## Frontend — Withdraw page (`src/routes/withdraw.tsx`)
- Read toggles via `getMyWallet` (extend it to also return the relevant site_settings flags, or fetch settings alongside).
- Render only the enabled destination-type buttons; default-select the first enabled one.
- Hide the "Use this wallet" connected-wallet shortcut when `withdraw_wallet_address_enabled` is false.

## Frontend — Admin panel (`src/routes/admin.tsx`)
In the existing Site Settings / Addresses section, add a "Payment methods" card with 7 switches matching the columns above. Save via the existing settings update flow. Show a small note: "Disabled methods are hidden from users on deposit/withdraw pages."

## Out of scope
- No changes to balances, transactions, on-chain verification logic, RLS model, or visual design tokens.
- Existing pending deposits/withdrawals on now-disabled methods continue to process normally.

## Technical notes
- Default values ensure existing rows automatically get `binance_*` enabled and the rest disabled after the migration (using `DEFAULT` + `UPDATE ... SET ... WHERE id=1` for the existing row).
- Toggle reads happen on each page mount — no caching layer needed.
