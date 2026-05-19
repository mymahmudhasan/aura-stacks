import { type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { bsc, mainnet } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { WC_PROJECT_ID } from "@/lib/web3/config";

const isBrowser = typeof window !== "undefined";

const config = createConfig({
  chains: [bsc, mainnet],
  ssr: true,
  transports: { [bsc.id]: http(), [mainnet.id]: http() },
  connectors: isBrowser
    ? [
        injected({ shimDisconnect: true }),
        walletConnect({ projectId: WC_PROJECT_ID, showQrModal: true }),
      ]
    : [],
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return <WagmiProvider config={config}>{children}</WagmiProvider>;
}
