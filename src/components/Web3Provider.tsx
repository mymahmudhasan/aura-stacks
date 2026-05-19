import { useEffect, useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { bsc, mainnet } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { WC_PROJECT_ID } from "@/lib/web3/config";

let _config: ReturnType<typeof createConfig> | null = null;
function getWagmiConfig() {
  if (_config) return _config;
  _config = createConfig({
    chains: [bsc, mainnet],
    transports: { [bsc.id]: http(), [mainnet.id]: http() },
    connectors: [
      injected({ shimDisconnect: true }),
      walletConnect({ projectId: WC_PROJECT_ID, showQrModal: true }),
    ],
  });
  return _config;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{children}</>;
  return <WagmiProvider config={getWagmiConfig()}>{children}</WagmiProvider>;
}
