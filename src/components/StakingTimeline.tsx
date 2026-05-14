import { useEffect, useMemo, useState } from "react";
import { Lock, Timer, TrendingUp, Coins, Calendar, Sparkles } from "lucide-react";

type Plan = {
  id: string;
  label: string;
  months: number;
  apy: number;
  min: number;
  type: "Flexible" | "Fixed";
  best?: boolean;
};

const PLANS: Plan[] = [
  { id: "1m", label: "1 Month", months: 1, apy: 12, min: 50, type: "Flexible" },
  { id: "3m", label: "3 Months", months: 3, apy: 18, min: 250, type: "Fixed" },
  { id: "6m", label: "6 Months", months: 6, apy: 26, min: 1000, type: "Fixed" },
  { id: "12m", label: "12 Months", months: 12, apy: 38, min: 2500, type: "Fixed", best: true },
];

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, targetMs - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, diff };
}

export function StakingTimeline() {
  const [planId, setPlanId] = useState<string>("12m");
  const [amount, setAmount] = useState<number>(2500);
  const plan = useMemo(() => PLANS.find((p) => p.id === planId)!, [planId]);

  // Anchor "lock start" so progress feels live but stable across renders.
  const startMs = useMemo(() => Date.now() - 1000 * 60 * 60 * 24 * 6, [planId]); // simulate 6 days in
  const endMs = useMemo(
    () => startMs + plan.months * 30 * 86400000,
    [startMs, plan.months]
  );
  const { d, h, m, s, diff } = useCountdown(endMs);

  const totalMs = endMs - startMs;
  const elapsed = Math.min(totalMs, Date.now() - startMs);
  const progress = Math.max(0, Math.min(100, (elapsed / totalMs) * 100));

  const dailyReward = (amount * (plan.apy / 100)) / 365;
  const earnedSoFar = (dailyReward * elapsed) / 86400000;
  const projected = dailyReward * (plan.months * 30);

  // Next 24h reward preview ticks live
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const liveDripPerSecond = dailyReward / 86400;
  void tick;

  return (
    <div className="relative rounded-3xl glass-strong p-6 md:p-8 overflow-hidden">
      <div className="absolute inset-0 bg-[image:var(--gradient-aurora)] opacity-40 pointer-events-none" />

      <div className="relative grid lg:grid-cols-5 gap-6">
        {/* Left: plan picker + amount */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary mb-3">Choose your plan</p>
            <div className="grid grid-cols-2 gap-2">
              {PLANS.map((p) => {
                const active = p.id === planId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPlanId(p.id);
                      setAmount((a) => Math.max(p.min, a));
                    }}
                    className={`relative text-left rounded-xl p-3 border transition ${
                      active
                        ? "border-primary/60 bg-primary/10 glow-primary"
                        : "border-border/60 glass hover:border-primary/30"
                    }`}
                  >
                    {p.best && (
                      <span className="absolute -top-2 right-2 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[image:var(--gradient-gold)] text-gold-foreground">
                        Best
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" /> {p.label}
                    </div>
                    <p className="text-2xl font-bold gradient-text mt-1">{p.apy}%</p>
                    <p className="text-[10px] text-muted-foreground">APY · {p.type}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Stake amount</p>
              <p className="text-sm font-mono text-primary">${fmt(amount)}</p>
            </div>
            <input
              type="range"
              min={plan.min}
              max={50000}
              step={50}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Min ${plan.min}</span>
              <span>$50,000</span>
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-gold" /> Live drip preview
            </div>
            <p className="text-2xl font-bold mt-1 font-mono text-gold">
              +${(liveDripPerSecond).toFixed(8)}
              <span className="text-xs text-muted-foreground font-sans"> / sec</span>
            </p>
          </div>
        </div>

        {/* Right: timeline + visualization */}
        <div className="lg:col-span-3 space-y-5">
          {/* Countdown */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" />
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Unlocks in
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {diff === 0 ? "Unlocked · ready to claim" : "Auto-claim on unlock"}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { l: "Days", v: d },
                { l: "Hours", v: h },
                { l: "Min", v: m },
                { l: "Sec", v: s },
              ].map((u) => (
                <div key={u.l} className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
                  <p className="text-2xl md:text-3xl font-bold font-mono gradient-text tabular-nums">
                    {String(u.v).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                    {u.l}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Locked balance visualization */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-gold" />
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Locked balance
                </p>
              </div>
              <p className="text-sm font-mono">
                <span className="text-gold">${fmt(amount)}</span>
                <span className="text-muted-foreground"> locked</span>
              </p>
            </div>

            <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[image:var(--gradient-primary)] rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gold border-2 border-background shadow-[0_0_12px_var(--gold)] transition-all duration-700"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
              <span>Start</span>
              <span className="text-primary">{progress.toFixed(1)}% complete</span>
              <span>Unlock</span>
            </div>

            {/* Milestone strip */}
            <div className="grid grid-cols-4 gap-1.5 mt-4">
              {[25, 50, 75, 100].map((mi) => {
                const reached = progress >= mi;
                return (
                  <div
                    key={mi}
                    className={`rounded-lg px-2 py-1.5 text-center text-[10px] border transition ${
                      reached
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-border/40 text-muted-foreground"
                    }`}
                  >
                    {mi}% milestone
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reward preview */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" /> Daily reward
              </div>
              <p className="text-xl font-bold mt-1 gradient-text">${fmt(dailyReward)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">paid every 24h</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5" /> Earned so far
              </div>
              <p className="text-xl font-bold mt-1 text-gold">${fmt(earnedSoFar)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">simulated · live</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5" /> At unlock
              </div>
              <p className="text-xl font-bold mt-1 gradient-text">${fmt(projected)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">total projected reward</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
