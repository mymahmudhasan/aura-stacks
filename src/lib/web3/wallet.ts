import { useCallback, useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain, useWalletClient } from "wagmi";
import { parseUnits } from "viem";
import { ERC20_ABI, USDT } from "@/lib/web3/config";

declare global {
  interface Window {
    tronWeb?: {
      ready?: boolean;
      defaultAddress?: { base58?: string };
      contract: () => {
        at: (addr: string) => Promise<{
          transfer: (
            to: string,
            amount: string,
          ) => { send: (opts?: { feeLimit?: number }) => Promise<string> };
        }>;
      };
    };
    tronLink?: { request: (args: { method: string }) => Promise<unknown> };
  }
}

export type WalletKind = "EVM" | "TRON";
export type SupportedNetwork = "BEP20" | "ERC20" | "TRC20";

export type ConnectedWallet = {
  address: string;
  kind: WalletKind;
  chainName: string;
};

export function useConnectedWallet() {
  const { address, isConnected, chainId } = useAccount();
  const [tron, setTron] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => {
      const w = window.tronWeb;
      if (w?.ready && w.defaultAddress?.base58) setTron(w.defaultAddress.base58);
    };
    check();
    const id = setInterval(check, 1500);
    return () => clearInterval(id);
  }, []);

  if (isConnected && address) {
    return {
      address,
      kind: "EVM" as WalletKind,
      chainName: chainId === 56 ? "BNB Chain" : chainId === 1 ? "Ethereum" : `Chain ${chainId}`,
    } satisfies ConnectedWallet;
  }
  if (tron) {
    return { address: tron, kind: "TRON" as WalletKind, chainName: "Tron" } satisfies ConnectedWallet;
  }
  return null;
}

export function useEvmConnect() {
  const { connectors, connectAsync, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  return {
    connectors: connectors.filter((c) => c.id === "injected" || c.id === "walletConnect"),
    connectAsync,
    disconnect,
    isPending,
  };
}

export async function connectTron(): Promise<string> {
  if (typeof window === "undefined") throw new Error("Window unavailable");
  if (!window.tronLink) throw new Error("TronLink not installed. Install the TronLink extension.");
  await window.tronLink.request({ method: "tron_requestAccounts" });
  // wait for tronWeb to be ready
  for (let i = 0; i < 20; i++) {
    if (window.tronWeb?.ready && window.tronWeb.defaultAddress?.base58) {
      return window.tronWeb.defaultAddress.base58;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("TronLink did not initialize");
}

export function useSendUsdt() {
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  return useCallback(
    async (network: SupportedNetwork, to: string, amount: number): Promise<string> => {
      if (network === "TRC20") {
        if (!window.tronWeb?.ready) throw new Error("Connect TronLink first");
        const contract = await window.tronWeb.contract().at(USDT.TRC20.address);
        const raw = BigInt(Math.round(amount * 10 ** USDT.TRC20.decimals)).toString();
        const txHash = await contract.transfer(to, raw).send({ feeLimit: 100_000_000 });
        return txHash;
      }
      if (!walletClient) throw new Error("Connect an EVM wallet first");
      const token = network === "BEP20" ? USDT.BEP20 : USDT.ERC20;
      if (walletClient.chain?.id !== token.chainId) {
        await switchChainAsync({ chainId: token.chainId });
      }
      const value = parseUnits(amount.toString(), token.decimals);
      const hash = await walletClient.writeContract({
        address: token.address,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [to as `0x${string}`, value],
      });
      return hash;
    },
    [walletClient, switchChainAsync],
  );
}
