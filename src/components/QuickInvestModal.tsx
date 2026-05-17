import { useMemo, useState } from "react";
import { Loader2, Brain, Cpu, Lock, X, Sparkles, TrendingUp, Flame, Crown, Zap } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { createInvestment } from "@/lib/wallet.functions";

type Service = "ai_trading" | "mining" | "staking";

type Pkg = {
  id: string;
  name: string;
  min: number;
  max?: number;
  roi: string;
  duration: string;
  tag?: string;
  hot?: boolean;
};

const SERVICES: Record<Service, { label: string; icon: React.ReactNode; tagline: string; packages: Pkg[] }> = {
  ai_trading: {
    label: "AI Trading Bot",
    icon: <Brain className="w-5 h-5" />,
    tagline: "Neural-network strategies · 24/7 auto-execution",
    packages: [
      { id: "ai_quantum", name: "Quantum Arbitrage", min: 100, max: 999, roi: "+11.2% / mo", duration: "30d", tag: "Starter" },
      { id: "ai_neural", name: "Neural Momentum", min: 1000, max: 4999, roi: "+12.8% / mo", duration: "45d", tag: "Popular", hot: true },
      { id: "ai_deepgrid", name: "DeepGrid Scalper", min: 5000, roi: "+14.3% / mo", duration: "60d", tag: "Top Pick", hot: true },
    ],
  },
  mining: {
    label: "Cloud Mining",
    icon: <Cpu className="w-5 h-5" />,
    tagline: "Industrial-grade hashrate · daily payouts",
    packages: [
      { id: "mn_starter", name: "Mining Starter", min: 100, max: 999, roi: "1.2% / day", duration: "30d", tag: "Easy" },
      { id: "mn_adv", name: "Mining Advanced", min: 1000, max: 4999, roi: "1.6% / day", duration: "45d", tag: "Popular" },
      { id: "mn_prem", name: "Mining Premium", min: 5000, max: 24999, roi: "2.0% / day", duration: "60d", tag: "Pro" },
      { id: "mn_vip", name: "Mining VIP", min: 25000, roi: "2.4% / day", duration: "90d", tag: "VIP" },
    ],
  },
  staking: {
    label: "Crypto Staking",
    icon: <Lock className="w-5 h-5" />,
    tagline: "Lock, stake & earn · flexible or fixed",
    packages: [
      { id: "st_1m", name: "1-Month Flexible", min: 50, roi: "12% APY", duration: "30d", tag: "Flex" },
      { id: "st_3m", name: "3-Month Fixed", min: 250, roi: "18% APY", duration: "90d", tag: "Balanced" },
      { id: "st_6m", name: "6-Month Fixed", min: 1000, roi: "26% APY", duration: "180d", tag: "Pro" },
      { id: "st_12m", name: "12-Month VIP", min: 2500, roi: "38% APY", duration: "365d", tag: "Best" },
    ],
  },
};

const PRESETS = [100, 250, 500, 1000, 2500, 5000];

export function QuickInvestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [service, setService] = useState<Service>("ai_trading");
  const [pkgId, setPkgId] = useState<string>("ai_neural");
  const [amount, setAmount] = useState<number>(1000);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const meta = SERVICES[service];
  const pkg = useMemo(() => meta.packages.find((p) => p.id === pkgId) ?? meta.packages[0], [meta, pkgId]);
  const tooLow = amount < pkg.min;
  const tooHigh = pkg.max ? amount > pkg.max : false;

  if (!open) return null;

  const pickService = (s: Service) => {
    setService(s);
    const first = SERVICES[s].packages.find((p) => p.hot) ?? SERVICES[s].packages[0];
    setPkgId(first.id);
    setAmount(Math.max(amount, first.min));
  };

  const pickPkg = (p: Pkg) => {
    setPkgId(p.id);
    setAmount((a) => Math.min(Math.max(a, p.min), p.max ?? Math.max(a, p.min)));
  };

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      await createInvestment({ data: { service, plan_name: pkg.name, amount: Number(amount) } });
      onClose();
      navigate({ to: "/wallet" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create investment");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-2xl my-8 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="absolute -inset-10 bg-[image:var(--gradient-aurora)] opacity-50 blur-3xl -z-10 rounded-full pointer-events-none" />
        <div className="rounded-2xl p-[1.5px] bg-[image:var(--gradient-aurora)] glow-primary">
          <div className="rounded-2xl bg-background/95 backdrop-blur-xl p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight inline-flex items-center gap-2">
                    Quick Invest
                    <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[image:var(--gradient-gold)] text-gold-foreground font-bold">Live</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">Pick a service, choose a package, confirm in one tap.</p>
                </div>
              </div>
              <button onClick={onClose} className="glass rounded-lg p-2 hover:bg-white/10"><X className="w-4 h-4" /></button>
            </div>

            {/* Service tabs — uniform design, AI marked with Top Pick badge */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {(Object.keys(SERVICES) as Service[]).map((s) => {
                const m = SERVICES[s];
                const active = service === s;
                const isAI = s === "ai_trading";
                return (
                  <button
                    key={s}
                    onClick={() => pickService(s)}
                    className={`relative rounded-xl p-3 text-left transition hover-scale ${
                      active
                        ? "border-2 border-primary bg-primary/10 glow-primary"
                        : "border border-white/10 glass hover:border-primary/40"
                    }`}
                  >
                    {isAI && (
                      <span className="absolute -top-2 -right-2 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[image:var(--gradient-gold)] text-gold-foreground font-bold shadow whitespace-nowrap">
                        Top Pick
                      </span>
                    )}
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2 bg-[image:var(--gradient-primary)] text-primary-foreground">
                      {m.icon}
                    </div>
                    <p className="text-xs font-bold leading-tight">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{m.tagline}</p>
                  </button>
                );
              })}
            </div>

            {/* Packages list — all highlighted */}
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 inline-flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" /> {meta.label} packages
            </label>
            <div className="grid sm:grid-cols-2 gap-2 mb-5 max-h-[260px] overflow-y-auto pr-1">
              {meta.packages.map((p) => {
                const active = p.id === pkgId;
                const isAI = service === "ai_trading";
                return (
                  <button
                    key={p.id}
                    onClick={() => pickPkg(p)}
                    className={`relative rounded-xl p-3 text-left transition hover-scale ${
                      active
                        ? isAI
                          ? "border-2 border-primary bg-primary/10 glow-primary"
                          : "border-2 border-gold/60 bg-gold/10"
                        : "border border-white/10 glass hover:border-primary/40"
                    }`}
                  >
                    {p.hot && (
                      <span className="absolute -top-2 right-2 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[image:var(--gradient-gold)] text-gold-foreground font-bold shadow inline-flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5" /> Hot
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold">{p.name}</p>
                      {p.tag && (
                        <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                          {p.tag}
                        </span>
                      )}
                    </div>
                    <p className={`text-base font-extrabold mt-1 ${isAI ? "text-primary" : "gradient-text"}`}>{p.roi}</p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                      <span>${p.min.toLocaleString()}{p.max ? ` – $${p.max.toLocaleString()}` : "+"}</span>
                      <span className="inline-flex items-center gap-1"><Crown className="w-3 h-3" /> {p.duration}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Amount */}
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Amount (USDT)</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {PRESETS.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  disabled={v < pkg.min || (pkg.max ? v > pkg.max : false)}
                  className={`rounded-lg py-2 text-xs font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed ${
                    amount === v ? "bg-[image:var(--gradient-primary)] text-primary-foreground glow-primary" : "glass hover:bg-primary/10"
                  }`}
                >
                  ${v}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={pkg.min}
              max={pkg.max}
              step="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full rounded-xl glass px-4 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-success" />
              {pkg.name} · min ${pkg.min}{pkg.max ? ` · max $${pkg.max.toLocaleString()}` : ""} · {pkg.roi}
            </p>
            {(tooLow || tooHigh) && (
              <p className="text-xs text-destructive mt-1">
                {tooLow ? `Minimum for ${pkg.name} is $${pkg.min}` : `Maximum for ${pkg.name} is $${pkg.max?.toLocaleString()}`}
              </p>
            )}

            {err && <p className="text-sm text-destructive mt-3">{err}</p>}

            <div className="flex gap-2 mt-5">
              <button onClick={onClose} className="flex-1 glass rounded-xl py-3 text-sm font-medium">Cancel</button>
              <button
                onClick={submit}
                disabled={busy || tooLow || tooHigh}
                className="flex-[2] rounded-xl py-3 text-sm font-bold bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold disabled:opacity-60 inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Confirm ${amount} · {pkg.name}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
