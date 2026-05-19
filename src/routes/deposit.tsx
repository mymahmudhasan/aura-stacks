import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Check, Loader2, ArrowLeft, Wallet, Zap } from "lucide-react";
import { GlassCard, Section } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { createDeposit, getDepositSettings, getMyDeposits, getMyProfile } from "@/lib/wallet.functions";
import { createOnChainDeposit, verifyOnChainDeposit } from "@/lib/web3/onchain.functions";
import { useConnectedWallet, useSendUsdt } from "@/lib/web3/wallet";

export const Route = createFileRoute("/deposit")({
  component: DepositPage,
  head: () => ({ meta: [{ title: "Deposit — Synexis" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
});

type Settings = {
  usdt_trc20_address: string | null; usdt_bep20_address: string | null; usdt_erc20_address: string | null; binance_pay_id: string | null;
  deposit_binance_pay_enabled?: boolean | null;
  deposit_trc20_enabled?: boolean | null;
  deposit_bep20_enabled?: boolean | null;
  deposit_erc20_enabled?: boolean | null;
  deposit_onchain_wallet_enabled?: boolean | null;
};
type Deposit = { id: string; amount: number; currency: string; network: string | null; tx_hash: string | null; status: string; created_at: string; admin_notes: string | null };

const ALL_NETWORKS = [
  { id: "BINANCE_PAY", label: "Binance Pay ID", key: "binance_pay_id", flag: "deposit_binance_pay_enabled" },
  { id: "TRC20", label: "USDT · TRC20 (Tron)", key: "usdt_trc20_address", flag: "deposit_trc20_enabled" },
  { id: "BEP20", label: "USDT · BEP20 (BSC)", key: "usdt_bep20_address", flag: "deposit_bep20_enabled" },
  { id: "ERC20", label: "USDT · ERC20 (Ethereum)", key: "usdt_erc20_address", flag: "deposit_erc20_enabled" },
] as const;
type NetId = typeof ALL_NETWORKS[number]["id"];

function DepositPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [network, setNetwork] = useState<NetId>("BINANCE_PAY");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [prefilled, setPrefilled] = useState(false);
  const [savedSender, setSavedSender] = useState<{ address: string | null; network: string | null; binance_uid: string | null }>({ address: null, network: null, binance_uid: null });
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);

  const refresh = async () => setDeposits(await getMyDeposits() as Deposit[]);

  useEffect(() => {
    (async () => {
      const [s, p] = await Promise.all([getDepositSettings(), getMyProfile()]);
      const settingsData = s as Settings | null;
      setSettings(settingsData);
      const prof = p as { last_sender_address: string | null; last_sender_network: string | null; binance_uid: string | null } | null;
      setSavedSender({
        address: prof?.last_sender_address ?? null,
        network: prof?.last_sender_network ?? null,
        binance_uid: prof?.binance_uid ?? null,
      });
      // Default-select first enabled network
      const firstEnabled = ALL_NETWORKS.find((n) =>
        n.id === "BINANCE_PAY"
          ? settingsData?.deposit_binance_pay_enabled !== false
          : settingsData?.[n.flag] === true,
      );
      if (firstEnabled) setNetwork(firstEnabled.id);
      await refresh();
    })();
  }, []);

  // Prefill sender when network changes (or on first load)
  useEffect(() => {
    if (network === "BINANCE_PAY") {
      if (savedSender.binance_uid) {
        setFromAddress(savedSender.binance_uid);
        setPrefilled(true);
      } else {
        setFromAddress("");
        setPrefilled(false);
      }
    } else if (savedSender.address && savedSender.network === network) {
      setFromAddress(savedSender.address);
      setPrefilled(true);
    } else {
      setFromAddress("");
      setPrefilled(false);
    }
  }, [network, savedSender]);

  const enabledNetworks = ALL_NETWORKS.filter((n) => settings?.[n.flag] !== false && (n.id === "BINANCE_PAY" ? true : settings?.[n.flag] === true));
  // Binance Pay defaults to enabled (!= false); others must be explicitly true
  const onchainEnabled = settings?.deposit_onchain_wallet_enabled === true;
  const activeNet = ALL_NETWORKS.find((n) => n.id === network);
  const address = (activeNet ? (settings?.[activeNet.key] as string | null | undefined) : null) ?? "";

  const isBinance = network === "BINANCE_PAY";
  const senderRegex = isBinance
    ? /^[a-zA-Z0-9_-]{3,64}$/
    : network === "TRC20"
      ? /^T[a-zA-Z0-9]{33}$/
      : /^0x[a-fA-F0-9]{40}$/;

  const [senderTouched, setSenderTouched] = useState(false);
  const trimmedSender = fromAddress.trim();
  const senderValid = senderRegex.test(trimmedSender);
  const showSenderError = senderTouched && trimmedSender.length > 0 && !senderValid;
  const senderErrorText = isBinance
    ? "Invalid Binance UID. Use 3–64 letters, numbers, _ or -."
    : network === "TRC20"
      ? "Invalid TRC20 address. Must start with T and be 34 characters."
      : `Invalid ${network} address. Must start with 0x and be 42 hex characters.`;

  useEffect(() => { setSenderTouched(false); }, [network]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSenderTouched(true);
    if (!senderValid) {
      setMsg({ ok: false, text: senderErrorText });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      await createDeposit({ data: { amount: Number(amount), network, tx_hash: txHash.trim(), from_address: trimmedSender } });
      setMsg({ ok: true, text: "Deposit submitted. Admin will confirm and credit your balance." });
      setAmount(""); setTxHash("");
      setSavedSender(isBinance
        ? { ...savedSender, binance_uid: trimmedSender }
        : { ...savedSender, address: trimmedSender, network });
      setPrefilled(true);
      await refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Failed to submit." });
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Section className="!py-12 max-w-4xl">
      <Link to="/wallet" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="w-4 h-4" /> Back to wallet</Link>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Deposit funds</h1>
      <p className="text-muted-foreground mb-6">Send USDT to the address below and submit your transaction hash for confirmation.</p>

      {onchainEnabled && (
        <WalletPayCard
          settings={settings}
          defaultNetwork={network === "BINANCE_PAY" ? "TRC20" : (network as "TRC20" | "BEP20" | "ERC20")}
          onDone={refresh}
        />
      )}

      <div className="grid md:grid-cols-2 gap-5">

        <GlassCard>
          {enabledNetworks.length === 0 ? (
            <>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Network</Label>
              <p className="text-sm text-muted-foreground mt-3">Deposits are temporarily unavailable. Please contact support.</p>
            </>
          ) : enabledNetworks.length > 1 ? (
            <>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Network</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {enabledNetworks.map((n) => (
                  <button key={n.id} type="button" onClick={() => setNetwork(n.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition ${network === n.id ? "bg-primary text-primary-foreground glow-primary" : "glass hover:bg-primary/10"}`}>
                    {n.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">{activeNet?.label ?? "Payment method"}</Label>
          )}

          <div className="mt-5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Send to</Label>
            <div className="mt-2 flex items-center gap-2 rounded-xl glass p-3">
              <code className="text-xs break-all flex-1">{address || "Not configured — contact support"}</code>
              <button onClick={copy} disabled={!address} className="shrink-0 p-2 rounded-lg hover:bg-primary/10">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Only send USDT on the selected network. Wrong-network transfers are not recoverable.</p>
          </div>
        </GlassCard>

        <GlassCard>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (USDT)</Label>
              <Input id="amount" type="number" min="1" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="hash">Transaction hash</Label>
              <Input id="hash" required minLength={4} value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x... or TRX..." className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">From your wallet's send confirmation.</p>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="sender">{isBinance ? "Your Binance UID" : "Your sending wallet address"}</Label>
                {prefilled && senderValid && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-success/15 text-success">Saved</span>}
              </div>
              <Input
                id="sender"
                required
                value={fromAddress}
                onChange={(e) => { setFromAddress(e.target.value); setPrefilled(false); setSenderTouched(true); }}
                onBlur={() => setSenderTouched(true)}
                placeholder={isBinance ? "e.g. 123456789" : network === "TRC20" ? "T..." : "0x..."}
                aria-invalid={showSenderError}
                aria-describedby="sender-help"
                className={`mt-1.5 font-mono text-xs ${showSenderError ? "border-destructive focus-visible:ring-destructive/40" : senderTouched && senderValid ? "border-success/60" : ""}`}
              />
              <p id="sender-help" className={`text-xs mt-1 ${showSenderError ? "text-destructive" : "text-muted-foreground"}`}>
                {showSenderError
                  ? senderErrorText
                  : prefilled
                    ? "Auto-filled from your last deposit. You can change it if needed."
                    : isBinance
                      ? "3–64 characters: letters, numbers, _ or -."
                      : network === "TRC20"
                        ? "Tron address: starts with T, 34 characters total."
                        : `${network} address: starts with 0x, 42 characters total.`}
              </p>
            </div>
            <button type="submit" disabled={submitting || !senderValid} className="w-full rounded-xl px-4 py-3 font-semibold bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit deposit
            </button>
            {msg && (
              <p className={`text-sm ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>
            )}
          </form>
        </GlassCard>
      </div>

      <GlassCard className="mt-6">
        <h3 className="font-semibold mb-3">My deposit history</h3>
        {deposits.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No deposits yet.</p>
        ) : (
          <ul className="divide-y divide-border/40 text-sm">
            {deposits.map((d) => (
              <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">${Number(d.amount).toLocaleString()} {d.currency} <span className="text-xs text-muted-foreground">· {d.network}</span></p>
                  <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()} · {d.tx_hash?.slice(0, 16)}…</p>
                  {d.admin_notes && <p className="text-xs text-muted-foreground mt-0.5">Admin: {d.admin_notes}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${d.status === "approved" ? "bg-success/15 text-success" : d.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-gold/15 text-gold"}`}>{d.status}</span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </Section>
  );
}

type WalletNet = "TRC20" | "BEP20" | "ERC20";

function WalletPayCard({ settings, defaultNetwork, onDone }: { settings: Settings | null; defaultNetwork: WalletNet; onDone: () => Promise<void> | void }) {
  const wallet = useConnectedWallet();
  const sendUsdt = useSendUsdt();
  const [net, setNet] = useState<WalletNet>(defaultNetwork);
  const [amt, setAmt] = useState("");
  const [phase, setPhase] = useState<"idle" | "sending" | "confirming" | "approved" | "error">("idle");
  const [reason, setReason] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");

  useEffect(() => { setNet(defaultNetwork); }, [defaultNetwork]);

  // Auto-pick a network the wallet supports
  useEffect(() => {
    if (!wallet) return;
    if (wallet.kind === "TRON" && net !== "TRC20") setNet("TRC20");
    if (wallet.kind === "EVM" && net === "TRC20") setNet("BEP20");
  }, [wallet, net]);

  const destAddress = settings
    ? net === "TRC20" ? settings.usdt_trc20_address
    : net === "BEP20" ? settings.usdt_bep20_address
    : settings.usdt_erc20_address
    : null;

  const compatible = wallet
    ? (wallet.kind === "TRON" ? net === "TRC20" : net !== "TRC20")
    : false;

  const pay = async () => {
    if (!wallet || !destAddress) return;
    setReason(""); setPhase("sending");
    try {
      const amount = Number(amt);
      if (!(amount > 0)) throw new Error("Enter an amount");
      const hash = await sendUsdt(net, destAddress, amount);
      setTxHash(hash);
      const dep = await createOnChainDeposit({
        data: { amount, network: net, tx_hash: hash, from_address: wallet.address },
      });
      setPhase("confirming");
      // poll up to 5 min
      for (let i = 0; i < 50; i++) {
        await new Promise((r) => setTimeout(r, 6000));
        const r = await verifyOnChainDeposit({ data: { deposit_id: dep.id } });
        if (r.status === "approved") {
          setPhase("approved");
          await onDone();
          return;
        }
        if (r.status === "rejected") {
          setPhase("error");
          setReason("Deposit rejected by admin.");
          return;
        }
        if ("reason" in r && r.reason) setReason(r.reason);
      }
      setReason("Still confirming — refresh later to see final status.");
    } catch (e) {
      setPhase("error");
      setReason(e instanceof Error ? e.message : "Payment failed");
    }
  };

  return (
    <GlassCard glow className="mb-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-gold" /> One-click on-chain deposit
          </p>
          <h3 className="font-semibold mt-1">Pay USDT directly from your wallet</h3>
        </div>
        {wallet && (
          <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-success/15 text-success">
            <Wallet className="w-3 h-3 inline mr-1" />{wallet.chainName}
          </span>
        )}
      </div>

      {!wallet && (
        <p className="text-sm text-muted-foreground mt-3">
          Connect MetaMask, WalletConnect, or TronLink (top right) to pay in one click. Otherwise use the manual form below.
        </p>
      )}

      {wallet && (
        <div className="mt-4 grid sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-1">
            <Label className="text-xs">Network</Label>
            <div className="grid grid-cols-3 gap-1 mt-1.5">
              {(["TRC20", "BEP20", "ERC20"] as const).map((n) => {
                const ok = wallet.kind === "TRON" ? n === "TRC20" : n !== "TRC20";
                return (
                  <button key={n} type="button" disabled={!ok} onClick={() => setNet(n)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition ${net === n ? "bg-primary text-primary-foreground" : "glass hover:bg-primary/10"} ${!ok ? "opacity-40 cursor-not-allowed" : ""}`}>
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="sm:col-span-1">
            <Label htmlFor="wc-amt" className="text-xs">Amount (USDT)</Label>
            <Input id="wc-amt" type="number" min="1" step="0.01" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="100" className="mt-1.5" />
          </div>
          <button
            type="button"
            disabled={!compatible || !destAddress || !amt || phase === "sending" || phase === "confirming"}
            onClick={pay}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {(phase === "sending" || phase === "confirming") && <Loader2 className="w-4 h-4 animate-spin" />}
            {phase === "sending" ? "Confirm in wallet…" : phase === "confirming" ? "Confirming on-chain…" : `Pay ${amt || "0"} USDT`}
          </button>
          {!compatible && wallet && (
            <p className="text-xs text-gold sm:col-span-3">
              Your {wallet.kind === "TRON" ? "TronLink" : "EVM"} wallet only supports {wallet.kind === "TRON" ? "TRC20" : "BEP20 / ERC20"}. Pick a compatible network.
            </p>
          )}
          {!destAddress && (
            <p className="text-xs text-destructive sm:col-span-3">
              {net} address not configured by admin yet. Use a different network or the manual form.
            </p>
          )}
          {phase === "approved" && (
            <p className="text-xs text-success sm:col-span-3 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Confirmed! Your balance has been credited.
            </p>
          )}
          {phase === "confirming" && reason && (
            <p className="text-xs text-muted-foreground sm:col-span-3">Status: {reason}</p>
          )}
          {phase === "error" && (
            <p className="text-xs text-destructive sm:col-span-3">{reason}</p>
          )}
          {txHash && (
            <p className="text-[10px] text-muted-foreground sm:col-span-3 font-mono break-all">tx: {txHash}</p>
          )}
        </div>
      )}
    </GlassCard>
  );
}

