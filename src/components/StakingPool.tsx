import { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Users,
  Coins,
  Timer,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Network,
  Wallet,
  Gift,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import poolImg from "@/assets/staking-prize-pool.jpg";
import { usePoolSettings } from "@/hooks/use-pool-settings";

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

function nextPoolClose() {
  // Closes at next 00:00 UTC
  const now = new Date();
  const close = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0
    )
  );
  return close.getTime();
}

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, targetMs - now);
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    diff,
  };
}

export function StakingPool() {
  const { settings, perWinner } = usePoolSettings();
  const POOL_TOTAL = settings.poolTotal;
  const WINNERS = settings.winners;
  const PER_WINNER = perWinner;
  const target = useMemo(() => nextPoolClose(), []);
  const { h, m, s, diff } = useCountdown(target);

  // Simulated pool participation (looks live, deterministic-ish)
  const [joined, setJoined] = useState<number>(7423);
  useEffect(() => {
    const t = setInterval(() => {
      setJoined((j) => (j < 9850 ? j + Math.floor(Math.random() * 3) : j));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // Pool fill progress over the day (based on time elapsed since 00:00 UTC)
  const dayMs = 86400000;
  const elapsedToday = dayMs - diff;
  const fillPct = Math.min(100, (elapsedToday / dayMs) * 100);

  return (
    <div className="space-y-8">
      {/* Hero card */}
      <div className="relative rounded-3xl overflow-hidden glass-strong">
        <div className="absolute inset-0 bg-[image:var(--gradient-aurora)] opacity-60" />
        <div className="grid lg:grid-cols-5">
          {/* Image */}
          <div className="relative lg:col-span-2 aspect-[4/3] lg:aspect-auto overflow-hidden">
            <img
              src={poolImg}
              alt="Daily reward pool infographic with 100 connected members"
              loading="lazy"
              width={1280}
              height={896}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/60 lg:to-background" />
          </div>

          {/* Content */}
          <div className="relative lg:col-span-3 p-6 md:p-10 space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[image:var(--gradient-gold)] text-gold-foreground text-[10px] uppercase tracking-widest font-semibold">
                <Sparkles className="w-3 h-3" /> Daily Pool · Live
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass text-[10px] uppercase tracking-widest text-primary">
                <Network className="w-3 h-3" /> Connected members only
              </span>
            </div>

            <div>
              <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
                <span className="gradient-text">$820,000 USDT</span> shared by{" "}
                <span className="text-gold">100 winners</span> — every 24 hours
              </h3>
              <p className="mt-3 text-sm md:text-base text-muted-foreground">
                Join the daily reward pool from any active staking plan. When the timer hits zero, 100 connected members are randomly selected and split the entire pool — that's <span className="text-foreground font-semibold">$8,200 USDT</span> per winner, paid instantly to your wallet.
              </p>
            </div>

            {/* Countdown */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-gold" /> Pool closes in
                </p>
                <p className="text-[10px] text-muted-foreground">Resets 00:00 UTC daily</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: "Hours", v: h },
                  { l: "Min", v: m },
                  { l: "Sec", v: s },
                ].map((u) => (
                  <div
                    key={u.l}
                    className="rounded-xl border border-gold/30 bg-gold/5 p-3 text-center"
                  >
                    <p className="text-2xl md:text-4xl font-bold font-mono text-gold tabular-nums">
                      {String(u.v).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                      {u.l}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pool fill bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Today's pool funding</span>
                <span className="font-mono text-gold">
                  ${(POOL_TOTAL * (fillPct / 100)).toLocaleString("en-US", { maximumFractionDigits: 0 })} / ${POOL_TOTAL.toLocaleString()}
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[image:var(--gradient-gold)] transition-all duration-700"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Per winner</p>
                <p className="text-lg font-bold gradient-text mt-1">${PER_WINNER.toLocaleString()}</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Joined today</p>
                <p className="text-lg font-bold text-gold mt-1 tabular-nums">{joined.toLocaleString()}</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Win odds</p>
                <p className="text-lg font-bold text-primary mt-1">~1 in {Math.max(1, Math.round(joined / WINNERS))}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[image:var(--gradient-gold)] text-gold-foreground text-sm font-semibold glow-gold"
              >
                <Trophy className="w-4 h-4" /> Join today's pool <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl glass text-sm font-medium"
              >
                <Wallet className="w-4 h-4" /> View my entries
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Infographic — How it works */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          {
            i: <Coins className="w-5 h-5" />,
            t: "Stake any plan",
            d: "Active stake of $50+ auto-enters today's reward pool. No extra fee.",
          },
          {
            i: <Network className="w-5 h-5" />,
            t: "Get connected",
            d: "Stay verified & online — only connected members are eligible at the draw.",
          },
          {
            i: <Timer className="w-5 h-5" />,
            t: "Pool closes 00:00 UTC",
            d: "When the timer hits zero, 100 winners are randomly drawn on-chain.",
          },
          {
            i: <Gift className="w-5 h-5" />,
            t: "Get $8,200 USDT",
            d: "Winners receive instant payout to Binance/Trust Wallet. Auto-credited.",
          },
        ].map((step, i) => (
          <div key={step.t} className="relative glass rounded-2xl p-5">
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground text-xs font-bold flex items-center justify-center glow-primary">
              {i + 1}
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center mb-3">
              {step.i}
            </div>
            <h4 className="font-semibold">{step.t}</h4>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{step.d}</p>
          </div>
        ))}
      </div>

      {/* Distribution + rules */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-bold">How $820,000 is divided</h4>
          </div>

          {/* Visual breakdown bar */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">100 winners × $8,200</span>
                <span className="font-mono text-gold">$820,000</span>
              </div>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-sm bg-gold/30 hover:bg-gold transition"
                    title={`Winner #${i + 1} · $8,200 USDT`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold gradient-text">100</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Winners / day</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gold">$8,200</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Per winner</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold gradient-text">USDT</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Instant payout</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h4 className="text-lg font-bold">Eligibility & rules</h4>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Must hold an active stake of $50+ across any plan.",
              "Account must be KYC verified and connected (online in last 24h).",
              "One entry per account per day — multiple stakes do not multiply odds.",
              "Winners drawn at 00:00 UTC; payouts settle within 60 seconds.",
              "Unclaimed prizes roll into the next day's pool — never lost.",
              "VIP & 12-month stakers get 2× entry weight in the draw.",
            ].map((r) => (
              <li key={r} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
