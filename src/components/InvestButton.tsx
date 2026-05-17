import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { createInvestment } from "@/lib/wallet.functions";

type Props = {
  service: "ai_trading" | "mining" | "staking";
  planName: string;
  minAmount: number;
  variant?: "gold" | "primary" | "ghost";
  className?: string;
  label?: string;
};

export function InvestButton({ service, planName, minAmount, variant = "primary", className = "", label = "Invest now" }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(minAmount));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const styles = {
    primary: "bg-primary text-primary-foreground glow-primary",
    gold: "bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold",
    ghost: "glass hover:bg-white/10",
  }[variant];

  const handleClick = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { navigate({ to: "/login" }); return; }
    setOpen(true);
  };

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      await createInvestment({ data: { service, plan_name: planName, amount: Number(amount) } });
      setOpen(false);
      navigate({ to: "/wallet" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  };

  return (
    <>
      <button onClick={handleClick} className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition ${styles} ${className}`}>
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="glass-strong rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Invest in {planName}</h3>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{service.replace("_", " ")} · Min ${minAmount}</p>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mt-4">Amount (USDT)</label>
            <input type="number" min={minAmount} step="1" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="mt-1.5 w-full rounded-lg glass px-3 py-2 text-sm" />
            <p className="text-xs text-muted-foreground mt-2">Funds are reserved from your wallet balance once the admin activates this investment.</p>
            {err && <p className="text-sm text-destructive mt-2">{err}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setOpen(false)} className="flex-1 glass rounded-xl py-2.5 text-sm">Cancel</button>
              <button onClick={submit} disabled={busy || Number(amount) < minAmount}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
