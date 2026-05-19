// USDT token addresses + minimal ABI used by the wallet-connect deposit flow.
export const USDT = {
  BEP20: {
    chainId: 56,
    address: "0x55d398326f99059fF775485246999027B3197955" as `0x${string}`,
    decimals: 18,
  },
  ERC20: {
    chainId: 1,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as `0x${string}`,
    decimals: 6,
  },
  TRC20: {
    address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    decimals: 6,
  },
} as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

// Public WalletConnect (Reown) Project ID — safe to ship in client bundle.
export const WC_PROJECT_ID =
  (import.meta.env?.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ||
  "38b99f5c-b24d-48c8-903a-a90951f52076";
