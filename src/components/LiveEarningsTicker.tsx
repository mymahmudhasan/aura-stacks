import { useCallback, useEffect, useMemo, useState } from "react";
import { Brain, Cpu, Lock, Clock, TrendingUp, Sparkles } from "lucide-react";
import { listLiveActiveInvestments } from "@/lib/wallet.functions";
import { listPlans } from "@/lib/plans.functions";

type Live = {
  id: string;
  service: string;
  plan_name: string;
  amount: number;
  started_at: string | null;
  ends_at: string | null;
  masked_handle: string;
};

type PlanRate = { name: string; service: string; daily: number };

const icon = (s: string) =>
  s === "ai_trading" ? <Brain className="w-4 h-4" /> :
  s === "mining" ? <Cpu className="w-4 h-4" /> :
  <Lock className="w-4 h-4" />;

export function LiveEarningsTicker() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<Live[]>([]);
  const [rates, setRates] = useState<PlanRate[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => { setMounted(true); }, []);

  const refresh = useCallback(async () => {
    try {
      const [live, plans] = await Promise.all([
        listLiveActiveInvestments(),
        listPlans({ data: {} }),
      ]);
      setItems(live as Live[]);
      setRates((plans as Array<{ name: string; service: string; daily_rate_pct: number | null; apy_pct: number | null }>).map((p) => ({
        name: p.name,
        service: p.service,
        daily: p.daily_rate_pct != null ? Number(p.daily_rate_pct) / 100
          : p.apy_pct != null ? Number(p.apy_pct) / 100 / 365
          : 0.01,
      })));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    refresh();
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [mounted, refresh]);

  useEffect(() => {
    if (!mounted) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [mounted]);

  const rateFor = useCallback((planName: string, service: string) => {
    const r = rates.find((x) => x.name === planName && x.service === service);
    return r?.daily ?? 0.01;
  }, [rates]);

  const cards = useMemo(() => items.slice(0, 12), [items]);

  if (!mounted || cards.length === 0) {
    return (
      <section className="relative overflow-hidden border-y border-border/40 py-8">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <p className="text-xs uppercase tracking-widest text-success">Live · Active investors earning right now</p>
          </div>
          <p className="text-sm text-muted-foreground">Loading live earnings feed…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-y border-border/40 py-10">
      <div className="absolute inset-0 bg-[image:var(--gradient-aurora)] opacity-40" />
      <div className="relative mx-auto max-w-7xl px-5">
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs uppercase tracking-widest text-success mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live · earning per second
            </div>
            <h3 className="text-xl md:text-2xl font-bold">
              <span className="gradient-text">Active investors</span> are accruing profit right now
            </h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-gold" /> {cards.length} packages running
            </p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2 px-2 pb-2">
          <div className="flex gap-3 min-w-max">
            {cards.map((it) => {
              const start = it.started_at ? new Date(it.started_at).getTime() : now;
              const end = it.ends_at ? new Date(it.ends_at).getTime() : start + 30 * 86_400_000;
              const total = Math.max(1, end - start);
              const pct = Math.max(0, Math.min(100, ((now - start) / total) * 100));
              const remaining = Math.max(0, end - now);
              const d = Math.floor(remaining / 86_400_000);
              const h = Math.floor((remaining % 86_400_000) / 3_600_000);
              const m = Math.floor((remaining % 3_600_000) / 60_000);
              const s = Math.floor((remaining % 60_000) / 1000);
              const elapsedDays = Math.max(0, Math.min(now, end) - start) / 86_400_000;
              const earned = it.amount * rateFor(it.plan_name, it.service) * elapsedDays;
              return (
                <div key={it.id} className="w-[280px] shrink-0 glass-strong rounded-2xl p-4 border border-primary/15">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground flex items-center justify-center">
                      {icon(it.service)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-muted-foreground truncate">{it.masked_handle}</p>
                      <p className="text-sm font-bold truncate">{it.plan_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                    <span>${it.amount.toLocaleString()} invested</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {String(d).padStart(2, "0")}d {String(h).padStart(2, "0")}h {String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-[image:var(--gradient-primary)] transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground capitalize">{it.service.replace("_", " ")}</span>
                    <span className="font-mono text-sm font-bold text-success inline-flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +${earned.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
