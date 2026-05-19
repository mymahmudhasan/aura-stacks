import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, Wallet } from "lucide-react";
import { GlassCard, Section } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getMyWallet, getMyWithdrawals, requestWithdrawal } from "@/lib/wallet.functions";
import { useConnectedWallet } from "@/lib/web3/wallet";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

export const Route = createFileRoute("/withdraw")({
  component: WithdrawPage,
  head: () => ({ meta: [{ title: "Withdraw — Synexis" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
});

type Withdrawal = { id: string; amount: number; currency: string; destination: string; destination_type: string; status: string; created_at: string; paid_at: string | null; admin_notes: string | null };

function WithdrawPage() {
  const [balance, setBalance] = useState(0);
  const [savedUid, setSavedUid] = useState<string>("");
  const [savedWallet, setSavedWallet] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [destinationType, setDestinationType] = useState<"binance_uid" | "wallet_address">("binance_uid");
  const [destination, setDestination] = useState("");
  const [useSaved, setUseSaved] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [flags, setFlags] = useState<{ binance_uid: boolean; wallet_address: boolean }>({ binance_uid: true, wallet_address: false });
  const wallet = useConnectedWallet();

  const refresh = async () => {
    const [w, list] = await Promise.all([getMyWallet(), getMyWithdrawals()]);
    const c = w.customer as { balance?: number; binance_uid?: string | null; binance_wallet_address?: string | null } | null;
    setBalance(Number(c?.balance ?? 0));
    setSavedUid(c?.binance_uid ?? "");
    setSavedWallet(c?.binance_wallet_address ?? "");
    setItems(list as Withdrawal[]);
    const f = (w as { withdraw_flags?: { binance_uid: boolean; wallet_address: boolean } }).withdraw_flags;
    if (f) {
      setFlags(f);
      // If current selection is disabled, switch to the first enabled
      if (!f[destinationType]) {
        if (f.binance_uid) setDestinationType("binance_uid");
        else if (f.wallet_address) setDestinationType("wallet_address");
      }
    }
  };
  useEffect(() => { refresh(); }, []);

  // Auto-fill destination with saved value when toggled or type changes
  useEffect(() => {
    if (!useSaved) return;
    const fill = destinationType === "binance_uid" ? savedUid : savedWallet;
    setDestination(fill);
  }, [useSaved, destinationType, savedUid, savedWallet]);

  const enabledTypes = (["binance_uid", "wallet_address"] as const).filter((t) => flags[t]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setMsg(null);
    try {
      const dest = (useSaved
        ? (destinationType === "binance_uid" ? savedUid : savedWallet)
        : destination).trim();
      if (!dest) throw new Error(destinationType === "binance_uid"
        ? "No Binance UID on file. Add it in Settings first."
        : "No wallet address on file. Add it in Settings first.");
      await requestWithdrawal({ data: { amount: Number(amount), destination_type: destinationType, destination: dest } });
      setMsg({ ok: true, text: `Withdrawal request submitted to ${destinationType === "binance_uid" ? "Binance UID" : "wallet"} ${dest}. Admin processes payouts manually within 24h.` });
      setAmount("");
      if (!useSaved) setDestination("");
      await refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Failed." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section className="!py-12 max-w-4xl">
      <Link to="/wallet" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="w-4 h-4" /> Back to wallet</Link>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold">Withdraw funds</h1>
        <ConnectWalletButton />
      </div>
      <p className="text-muted-foreground mb-6">Available balance: <span className="gradient-text font-bold">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>

      {wallet && (
        <GlassCard className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="w-4 h-4 text-success" />
              <span>Send payout to your connected <strong>{wallet.chainName}</strong> wallet</span>
              <code className="text-xs font-mono text-muted-foreground">{wallet.address.slice(0, 6)}…{wallet.address.slice(-6)}</code>
            </div>
            <button
              type="button"
              onClick={() => {
                setDestinationType("wallet_address");
                setUseSaved(false);
                setDestination(wallet.address);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground"
            >
              Use this wallet
            </button>
          </div>
        </GlassCard>
      )}


      <GlassCard>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Destination type</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {(["binance_uid", "wallet_address"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setDestinationType(t)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition ${destinationType === t ? "bg-primary text-primary-foreground glow-primary" : "glass hover:bg-primary/10"}`}>
                    {t === "binance_uid" ? "Binance UID" : "USDT Address"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="amount">Amount (USDT)</Label>
              <Input id="amount" type="number" min="10" max={balance} step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">Minimum $10.</p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label htmlFor="dest">{destinationType === "binance_uid" ? "Your Binance UID" : "USDT wallet address"}</Label>
              <Link to="/settings" className="text-xs text-primary hover:underline">Manage in Settings →</Link>
            </div>
            {(() => {
              const saved = destinationType === "binance_uid" ? savedUid : savedWallet;
              if (saved) {
                return (
                  <div className="space-y-2">
                    <div className="rounded-xl glass px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">On file</p>
                        <p className="text-sm font-mono truncate">{saved}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button type="button" onClick={() => setUseSaved(true)}
                          className={`text-[10px] px-2 py-1 rounded ${useSaved ? "bg-primary text-primary-foreground" : "glass"}`}>Use this</button>
                        <button type="button" onClick={() => { setUseSaved(false); setDestination(""); }}
                          className={`text-[10px] px-2 py-1 rounded ${!useSaved ? "bg-primary text-primary-foreground" : "glass"}`}>Override</button>
                      </div>
                    </div>
                    {!useSaved && (
                      <Input id="dest" required value={destination} onChange={(e) => setDestination(e.target.value)}
                        placeholder={destinationType === "binance_uid" ? "284910321" : "TRX..."} className="font-mono" />
                    )}
                  </div>
                );
              }
              return (
                <>
                  <Input id="dest" required value={destination} onChange={(e) => setDestination(e.target.value)}
                    placeholder={destinationType === "binance_uid" ? "284910321" : "TRX..."} className="font-mono" />
                  <p className="text-xs text-gold mt-1.5">
                    Tip: <Link to="/settings" className="underline">save your {destinationType === "binance_uid" ? "Binance UID" : "wallet"} in Settings</Link> to auto-fill next time.
                  </p>
                </>
              );
            })()}
          </div>
          <button type="submit" disabled={submitting || balance <= 0} className="w-full rounded-xl px-4 py-3 font-semibold bg-primary text-primary-foreground glow-primary disabled:opacity-60 inline-flex items-center justify-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Request withdrawal
          </button>
          {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>}
        </form>
      </GlassCard>

      <GlassCard className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Withdrawal history</h3>
          <button type="button" onClick={refresh} className="text-xs text-primary hover:underline">Refresh</button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No withdrawals yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {items.map((w) => {
              const failed = w.status === "rejected" || w.status === "failed" || w.status === "cancelled";
              const paid = w.status === "paid";
              const pending = !failed && !paid;
              const badgeCls = paid
                ? "bg-success/15 text-success"
                : failed
                ? "bg-destructive/15 text-destructive"
                : "bg-gold/15 text-gold";
              return (
                <li key={w.id} className="rounded-xl glass p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        ${Number(w.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {w.currency}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Ref <span className="font-mono">{w.id.slice(0, 8)}</span>
                      </p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${badgeCls}`}>
                      {w.status}
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Requested</dt>
                      <dd>{new Date(w.created_at).toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">{paid ? "Paid" : "Settled"}</dt>
                      <dd>{w.paid_at ? new Date(w.paid_at).toLocaleString() : "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2 sm:col-span-2">
                      <dt className="text-muted-foreground shrink-0">
                        {w.destination_type === "binance_uid" ? "Binance UID" : "Wallet"}
                      </dt>
                      <dd className="font-mono truncate">{w.destination}</dd>
                    </div>
                  </dl>
                  {w.admin_notes && (
                    <div className={`mt-2 rounded-lg px-3 py-2 text-xs ${failed ? "bg-destructive/10 text-destructive" : "bg-muted/40 text-muted-foreground"}`}>
                      <span className="font-semibold">{failed ? "Failure reason" : "Admin note"}:</span> {w.admin_notes}
                    </div>
                  )}
                  {failed && !w.admin_notes && (
                    <p className="mt-2 text-xs text-destructive">
                      This payout did not go through. Contact support with reference <span className="font-mono">{w.id.slice(0, 8)}</span> to investigate.
                    </p>
                  )}
                  {pending && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Awaiting manual processing. Payouts are reviewed within 24h.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
    </Section>
  );
}
