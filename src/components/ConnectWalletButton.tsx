import { useState } from "react";
import { Wallet, Loader2, LogOut, Link as LinkIcon } from "lucide-react";
import { connectTron, useConnectedWallet, useEvmConnect } from "@/lib/web3/wallet";
import { useDisconnect } from "wagmi";

export function ConnectWalletButton() {
  const wallet = useConnectedWallet();
  const { connectors, connectAsync, isPending } = useEvmConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (wallet) {
    return (
      <div className="flex items-center gap-2 rounded-xl glass p-2 pr-3">
        <span className="w-7 h-7 rounded-lg bg-success/15 text-success flex items-center justify-center">
          <Wallet className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground leading-tight">
            {wallet.chainName}
          </p>
          <p className="text-xs font-mono truncate">
            {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => disconnect()}
          className="ml-2 p-1.5 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
          title="Disconnect"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground glow-primary"
      >
        <LinkIcon className="w-4 h-4" /> Connect wallet
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 z-30 glass-strong rounded-xl border border-border/60 p-2 space-y-1">
          {connectors.map((c) => (
            <button
              key={c.uid}
              type="button"
              disabled={isPending}
              onClick={async () => {
                setErr(null); setBusy(c.id);
                try {
                  await connectAsync({ connector: c });
                  setOpen(false);
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Connect failed");
                } finally {
                  setBusy(null);
                }
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-primary/10 text-sm"
            >
              <span>{c.name}{c.id === "injected" ? " (MetaMask)" : ""}</span>
              {busy === c.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            </button>
          ))}
          <button
            type="button"
            disabled={busy === "tron"}
            onClick={async () => {
              setErr(null); setBusy("tron");
              try {
                await connectTron();
                setOpen(false);
              } catch (e) {
                setErr(e instanceof Error ? e.message : "TronLink failed");
              } finally {
                setBusy(null);
              }
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-primary/10 text-sm"
          >
            <span>TronLink (TRC20)</span>
            {busy === "tron" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          </button>
          {err && <p className="text-xs text-destructive px-2 pt-1">{err}</p>}
        </div>
      )}
    </div>
  );
}
