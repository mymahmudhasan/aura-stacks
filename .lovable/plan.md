
# Web3 wallet connect — deposits + payout requests

Let users connect MetaMask / WalletConnect (EVM: BEP20, ERC20) or TronLink (TRC20), send USDT in one click, have the deposit auto-confirmed on-chain (no admin step), and pre-fill payout destination from the connected wallet.

## What changes for the user

1. New **"Connect wallet"** button on `/deposit` and `/withdraw` (and in the wallet header).
2. On `/deposit`: pick network → click **Pay** → wallet popup → confirm → status flips from `pending` → `confirming` → `approved` automatically once the chain confirms. No tx hash typing, no admin wait.
3. On `/withdraw`: connected wallet's address auto-fills the destination. Admin still pays out manually (no change to that side).
4. A wallet connection persists in `localStorage` (and is shown as a chip in the header so users can disconnect / switch).

## Architecture

```text
Browser                          Server (TanStack fn)            Chain
──────                           ─────────────────────            ─────
WalletConnectProvider
  ├─ wagmi (EVM)        ─send──► createOnChainDeposit ──insert──► (BSC/ETH)
  │   MetaMask, WC v2              status='confirming'              │
  └─ TronLink (TRC20)   ─send──► same fn (network=TRC20)            │
                                                                    ▼
                                  pollDepositStatus  ◄──RPC reads tx
                                  (called from client every 6s,
                                   marks deposit approved + credits
                                   wallet via existing trigger)
```

We reuse the existing `deposits` row + `handle_deposit_status` trigger — flipping status to `approved` already credits the balance and fires the welcome bonus. No DB rewrite.

## Implementation

### 1. Dependencies
```
bun add wagmi viem @tanstack/react-query @reown/appkit @reown/appkit-adapter-wagmi tronweb
```
(`@tanstack/react-query` is likely already present.)

### 2. Secrets
- `VITE_WALLETCONNECT_PROJECT_ID` — public, from cloud.reown.com (free).
- `EVM_RPC_BSC`, `EVM_RPC_ETH`, `TRON_RPC` — server-side RPC URLs (Ankr/public OK). Used to verify tx in the polling fn.

### 3. New files
- `src/lib/web3/config.ts` — wagmi config (BSC + Ethereum mainnet), USDT contract addresses + ABI, TRC20 USDT address.
- `src/components/Web3Provider.tsx` — wraps app with WagmiProvider + AppKit modal; mounted in `src/routes/__root.tsx`.
- `src/components/ConnectWalletButton.tsx` — handles EVM connect (AppKit) and TronLink connect; exposes `useConnectedWallet()` hook returning `{ address, chain: 'EVM'|'TRON', sendUsdt(network, toAddress, amount) }`.
- `src/lib/web3/sendUsdt.ts` — `writeContract` (`transfer(address,uint256)`) for EVM, `tronWeb.contract().transfer()` for TRC20. Returns tx hash.

### 4. New server fns in `src/lib/wallet.functions.ts`
- `createOnChainDeposit({ amount, network, tx_hash, from_address })` — like `createDeposit` but inserts with `method='wallet_connect'` and `status='pending'` (still pending until verified).
- `verifyOnChainDeposit({ deposit_id })` — server-side: fetches the tx via JSON-RPC, confirms (a) to-address matches `site_settings`, (b) ERC20 `Transfer` event amount ≥ submitted amount, (c) ≥ 1 confirmation. On success, `supabaseAdmin.from('deposits').update({ status:'approved' })` — trigger credits balance.

### 5. Deposit UI changes (`src/routes/deposit.tsx`)
- Add `<ConnectWalletButton />` at top of the form card.
- When connected, swap the manual form for a **Pay with wallet** flow: amount input → "Pay $X USDT" button → calls `sendUsdt` → on tx hash, calls `createOnChainDeposit` → starts polling `verifyOnChainDeposit` every 6s (max 5 min) → updates UI badge `confirming → approved`.
- Manual form stays available as a fallback ("Send manually instead").

### 6. Withdraw UI changes (`src/routes/withdraw.tsx`)
- When wallet connected and destination type matches (EVM ↔ wallet_address, TRC20 ↔ wallet_address), add a "Use connected wallet (`0x1234…abcd`)" button that fills `destination` and `destination_type='wallet_address'`. No backend change.

### 7. Admin
- No schema changes. Admin sees these deposits in the existing list with `method='wallet_connect'` and `network=<chain>`. Since they're auto-approved, they'll mostly land already approved. Add a small filter chip in admin deposits tab.

## Out of scope
- Smart-contract escrow / on-chain withdrawals (admin still pays manually).
- Solana / non-EVM chains beyond Tron.
- Gasless/relayer transactions.

## Validation
1. Connect MetaMask on BSC → pay $10 USDT → row appears `pending` → within ~15s flips to `approved` → wallet balance + $10.
2. Same with TronLink → TRC20 USDT.
3. WalletConnect mobile QR flow on a phone.
4. `/withdraw` with EVM wallet → "Use connected wallet" fills destination → request submits.
5. Verify trying to spoof `verifyOnChainDeposit` with a fake tx hash fails (chain lookup mismatches `to` or `amount`).
