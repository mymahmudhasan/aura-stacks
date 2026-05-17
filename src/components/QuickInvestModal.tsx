import { useEffect, useMemo, useState } from "react";
import { Loader2, Brain, Cpu, Lock, X, Sparkles, TrendingUp, Flame, Crown, Zap, RefreshCw } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { createInvestment } from "@/lib/wallet.functions";
import { listPlans } from "@/lib/plans.functions";

type Service = "ai_trading" | "mining" | "staking";

type Pkg = {
  id: string;
  name: string;
  min: number;
  max?: number;
  roi: string;
  duration: string;
  durationDays: number;
  tag?: string;
  hot?: boolean;
};

type DBPlan = {
  id: string;
  service: Service;
  name: string;
  min_amount: number | string;
  max_amount: number | string | null;
  daily_rate_pct: number | string | null;
  apy_pct: number | string | null;
  duration_days: number | null;
  badge: string | null;
  flex: string | null;
  is_popular: boolean;
};

const SERVICE_META: Record<Service, { label: string; icon: React.ReactNode; tagline: string }> = {
  ai_trading: { label: "AI Trading Bot", icon: <Brain className="w-5 h-5" />, tagline: "Neural-network strategies · 24/7 auto-execution" },
  mining: { label: "Cloud Mining", icon: <Cpu className="w-5 h-5" />, tagline: "Industrial-grade hashrate · daily payouts" },
  staking: { label: "Crypto Staking", icon: <Lock className="w-5 h-5" />, tagline: "Lock, stake & earn · flexible or fixed" },
};

const PRESETS = [100, 250, 500, 1000, 2500, 5000];

function dbToPkg(p: DBPlan): Pkg {
  const daily = p.daily_rate_pct == null ? null : Number(p.daily_rate_pct);
  const apy = p.apy_pct == null ? null : Number(p.apy_pct);
  const roi =
    apy != null ? `${apy}% APY` :
    daily != null ? `${daily}% / day` :
    "—";
  const days = p.duration_days ?? 30;
  return {
    id: p.id,
    name: p.name,
    min: Number(p.min_amount),
    max: p.max_amount == null ? undefined : Number(p.max_amount),
    roi,
    duration: `${days}d`,
    durationDays: days,
    tag: p.badge ?? p.flex ?? undefined,
    hot: p.is_popular,
  };
}

export function QuickInvestForm({ onDone, compact = false }: { onDone?: () => void; compact?: boolean }) {
  const navigate = useNavigate();
  const [service, setService] = useState<Service>("ai_trading");
  const [packages, setPackages] = useState<Record<Service, Pkg[]>>({ ai_trading: [], mining: [], staking: [] });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errLoad, setErrLoad] = useState<string | null>(null);
  const [pkgId, setPkgId] = useState<string>("");
  const [amount, setAmount] = useState<number>(1000);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const loadAll = async () => {
    setStatus("loading"); setErrLoad(null);
    try {
      const rows = await listPlans({ data: {} });
      const grouped: Record<Service, Pkg[]> = { ai_trading: [], mining: [], staking: [] };
      for (const r of rows as DBPlan[]) {
        if (r.service in grouped) grouped[r.service].push(dbToPkg(r));
      }
      setPackages(grouped);
      const firstSvc = (Object.keys(grouped) as Service[]).find((s) => grouped[s].length > 0) ?? "ai_trading";
      setService(firstSvc);
      const hot = grouped[firstSvc].find((p) => p.hot) ?? grouped[firstSvc][0];
      if (hot) { setPkgId(hot.id); setAmount(Math.max(amount, hot.min)); }
      setStatus("ready");
    } catch (e) {
      setErrLoad(e instanceof Error ? e.message : "Failed to load packages");
      setStatus("error");
    }
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const list = packages[service] ?? [];
  const pkg = useMemo(() => list.find((p) => p.id === pkgId) ?? list[0], [list, pkgId]);
  const tooLow = pkg ? amount < pkg.min : false;
  const tooHigh = pkg?.max ? amount > pkg.max : false;

  const pickService = (s: Service) => {
    setService(s);
    const first = (packages[s] ?? []).find((p) => p.hot) ?? (packages[s] ?? [])[0];
    if (first) { setPkgId(first.id); setAmount((a) => Math.max(a, first.min)); }
    else setPkgId("");
  };

  const pickPkg = (p: Pkg) => {
    setPkgId(p.id);
    setAmount((a) => Math.min(Math.max(a, p.min), p.max ?? Math.max(a, p.min)));
  };

  const submit = async () => {
    if (!pkg) return;
    setBusy(true); setErr(null); setOk(null);
    try {
      await createInvestment({ data: { service, plan_name: pkg.name, amount: Number(amount), duration_days: pkg.durationDays } });
      setOk(`Invested $${amount} in ${pkg.name}`);
      onDone?.();
      setTimeout(() => navigate({ to: "/wallet" }), 600);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create investment");
    } finally { setBusy(false); }
  };

  if (status === "loading") {
    return (
      <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <p className="text-xs">Loading packages…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-destructive mb-3">{errLoad}</p>
        <button onClick={loadAll} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-primary/10 text-sm">
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Service tabs */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(Object.keys(SERVICE_META) as Service[]).map((s) => {
          const m = SERVICE_META[s];
          const active = service === s;
          const isAI = s === "ai_trading";
          const count = (packages[s] ?? []).length;
          return (
            <button
              key={s}
              onClick={() => pickService(s)}
              disabled={count === 0}
              className={`relative rounded-xl p-3 text-left transition hover-scale disabled:opacity-40 disabled:cursor-not-allowed ${
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
              <p className="text-[10px] text-primary mt-1">{count} package{count === 1 ? "" : "s"}</p>
            </button>
          );
        })}
      </div>

      {/* Packages */}
      <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 inline-flex items-center gap-1">
        <Zap className="w-3 h-3 text-primary" /> {SERVICE_META[service].label} packages
      </label>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center glass rounded-xl">No packages available for this service yet.</p>
      ) : (
        <div className={`grid sm:grid-cols-2 gap-2 mb-4 ${compact ? "max-h-[220px]" : "max-h-[260px]"} overflow-y-auto pr-1`}>
          {list.map((p) => {
            const active = p.id === pkgId;
            return (
              <button
                key={p.id}
                onClick={() => pickPkg(p)}
                className={`relative rounded-xl p-3 text-left transition hover-scale ${
                  active
                    ? "border-2 border-primary bg-primary/10 glow-primary"
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
                <p className="text-base font-extrabold mt-1 text-primary">{p.roi}</p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                  <span>${p.min.toLocaleString()}{p.max ? ` – $${p.max.toLocaleString()}` : "+"}</span>
                  <span className="inline-flex items-center gap-1"><Crown className="w-3 h-3" /> {p.duration}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {pkg && (
        <>
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
          {ok && <p className="text-sm text-success mt-3">{ok}</p>}

          <button
            onClick={submit}
            disabled={busy || tooLow || tooHigh}
            className="mt-4 w-full rounded-xl py-3 text-sm font-bold bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold disabled:opacity-60 inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Confirm ${amount} · {pkg.name}
          </button>
        </>
      )}
    </div>
  );
}

export function QuickInvestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in overflow-y-auto" onClick={onClose}>
      <div className="relative w-full max-w-2xl my-8 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="absolute -inset-10 bg-[image:var(--gradient-aurora)] opacity-50 blur-3xl -z-10 rounded-full pointer-events-none" />
        <div className="rounded-2xl p-[1.5px] bg-[image:var(--gradient-aurora)] glow-primary">
          <div className="rounded-2xl bg-background/95 backdrop-blur-xl p-6">
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
            <QuickInvestForm onDone={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}
