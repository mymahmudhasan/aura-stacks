import { useState } from "react";
import { Loader2, Brain, Cpu, Lock, X, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { createInvestment } from "@/lib/wallet.functions";

type Service = "ai_trading" | "mining" | "staking";

const PLANS: Record<Service, { name: string; min: number; roi: string; icon: React.ReactNode; tag: string }> = {
  ai_trading: { name: "AI Trading Bot", min: 100, roi: "+14.3% / mo", icon: <Brain className="w-5 h-5" />, tag: "Top Pick" },
  mining: { name: "Cloud Mining", min: 50, roi: "+8.5% / mo", icon: <Cpu className="w-5 h-5" />, tag: "Steady" },
  staking: { name: "Crypto Staking", min: 50, roi: "+6.2% / mo", icon: <Lock className="w-5 h-5" />, tag: "Safe" },
};

const PRESETS = [100, 250, 500, 1000, 2500, 5000];

export function QuickInvestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [service, setService] = useState<Service>("ai_trading");
  const [amount, setAmount] = useState<number>(500);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;
  const plan = PLANS[service];
  const tooLow = amount < plan.min;

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      await createInvestment({ data: { service, plan_name: plan.name, amount: Number(amount) } });
      onClose();
      navigate({ to: "/wallet" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create investment");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="absolute -inset-8 bg-[image:var(--gradient-aurora)] opacity-40 blur-3xl -z-10 rounded-full pointer-events-none" />
        <div className="rounded-2xl p-[1.5px] bg-[image:var(--gradient-aurora)] glow-primary">
          <div className="rounded-2xl bg-background/95 backdrop-blur-xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">Quick Invest</h3>
                  <p className="text-xs text-muted-foreground">Choose a plan, pick an amount, confirm.</p>
                </div>
              </div>
              <button onClick={onClose} className="glass rounded-lg p-2 hover:bg-white/10"><X className="w-4 h-4" /></button>
            </div>

            {/* Service picker — AI trading highlighted */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {(Object.keys(PLANS) as Service[]).map((s) => {
                const p = PLANS[s];
                const active = service === s;
                const isAI = s === "ai_trading";
                return (
                  <button
                    key={s}
                    onClick={() => { setService(s); setAmount(Math.max(amount, p.min)); }}
                    className={`relative rounded-xl p-3 text-left transition hover-scale ${
                      active
                        ? isAI
                          ? "border-2 border-primary bg-primary/10 glow-primary"
                          : "border-2 border-gold/60 bg-gold/10"
                        : "border border-white/10 glass hover:border-primary/40"
                    }`}
                  >
                    {isAI && (
                      <span className="absolute -top-2 -right-2 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[image:var(--gradient-gold)] text-gold-foreground font-bold shadow">
                        Top
                      </span>
                    )}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                      isAI ? "bg-[image:var(--gradient-primary)] text-primary-foreground" : "bg-primary/15 text-primary"
                    }`}>
                      {p.icon}
                    </div>
                    <p className="text-xs font-bold leading-tight">{p.name}</p>
                    <p className="text-[10px] text-success mt-0.5">{p.roi}</p>
                  </button>
                );
              })}
            </div>

            {/* Amount presets */}
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Amount (USDT)</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {PRESETS.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`rounded-lg py-2 text-xs font-semibold transition ${
                    amount === v ? "bg-[image:var(--gradient-primary)] text-primary-foreground glow-primary" : "glass hover:bg-primary/10"
                  }`}
                >
                  ${v}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={plan.min}
              step="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full rounded-xl glass px-4 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-success" />
              Min ${plan.min} · projected ~${(amount * 0.143).toFixed(0)} / mo at top rate
            </p>

            {err && <p className="text-sm text-destructive mt-3">{err}</p>}

            <div className="flex gap-2 mt-5">
              <button onClick={onClose} className="flex-1 glass rounded-xl py-3 text-sm font-medium">Cancel</button>
              <button
                onClick={submit}
                disabled={busy || tooLow}
                className="flex-[2] rounded-xl py-3 text-sm font-bold bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold disabled:opacity-60 inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Confirm ${amount} in {plan.name}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
