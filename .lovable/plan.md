## Goal
Since only Binance Pay (deposit) and Binance UID (withdraw) are active by default, remove the user-facing "Connect wallet" button and any redundant single-option UI from the deposit and withdraw pages. Keep all backend toggles and the on-chain WalletPayCard plumbing intact so admins can re-enable on-chain methods later.

## Changes

### `src/routes/deposit.tsx`
- Remove the `<ConnectWalletButton />` from the header (and drop its import).
- Update the subtitle from "Pay in one click with your connected wallet, or send manually…" to "Send USDT to the address below and submit your transaction hash for confirmation." — the one-click copy is misleading when on-chain pay is off.
- When `enabledNetworks.length === 1` (default Binance-only case), hide the network selector buttons entirely. Keep the "Send to" address block.
- Leave `WalletPayCard` as is — already gated by `onchainEnabled`; only renders when admin turns it on.

### `src/routes/withdraw.tsx`
- Remove the `<ConnectWalletButton />` from the header (and drop its import).
- "Use this connected wallet" shortcut card is already gated by `flags.wallet_address` — no change; it's hidden by default.

### Not changed
- `ConnectWalletButton.tsx`, `Web3Provider.tsx`, `src/lib/web3/*` — kept for when admin re-enables on-chain methods (the connect UI then reappears inside `WalletPayCard`).
- Backend, DB toggles, admin panel — already correct from the previous turn.
- All other routes.

## Result
Default Binance-only experience: no Connect Wallet button, no lone "Binance Pay ID" network toggle. Admin can re-enable on-chain rails from the admin panel and the wallet-connect flow returns automatically inside the on-chain pay card.
