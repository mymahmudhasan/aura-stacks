import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BadgeCheck, Cpu, Lock, Bot, ShieldCheck, Wallet, Zap, TrendingUp } from "lucide-react";
import { CTA } from "@/components/ui-bits";

type Deposit = {
  id: number;
  handle: string;
  country: string;
  flag: string;
  amount: number;
  service: "AI Bot" | "Mining" | "Staking";
  ago: string;
  tx: string;
};

const SEED: Omit<Deposit, "id" | "ago">[] = [
  { handle: "ali_***82", country: "AE", flag: "🇦🇪", amount: 4820, service: "AI Bot", tx: "0x9f…a21c" },
  { handle: "maria_***", country: "BR", flag: "🇧🇷", amount: 1240, service: "Mining", tx: "0x18…77e2" },
  { handle: "kenji_***", country: "JP", flag: "🇯🇵", amount: 9800, service: "Staking", tx: "0xab…0d94" },
  { handle: "samir_***", country: "IN", flag: "🇮🇳", amount: 320, service: "AI Bot", tx: "0x7c…ff10" },
  { handle: "lukas_***", country: "DE", flag: "🇩🇪", amount: 15600, service: "Staking", tx: "0x4a…22b8" },
  { handle: "chloe_***", country: "FR", flag: "🇫🇷", amount: 2100, service: "Mining", tx: "0x6e…1183" },
  { handle: "noah_***", country: "US", flag: "🇺🇸", amount: 7400, service: "AI Bot", tx: "0xd2…9a04" },
  { handle: "amina_***", country: "NG", flag: "🇳🇬", amount: 540, service: "Mining", tx: "0x33…b7c1" },
  { handle: "leo_***", country: "IT", flag: "🇮🇹", amount: 3260, service: "Staking", tx: "0x88…4e2f" },
  { handle: "sofia_***", country: "ES", flag: "🇪🇸", amount: 1180, service: "AI Bot", tx: "0x21…6fa9" },
];

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function LiveDeposits() {
  const [mounted, setMounted] = useState(false);
  // Use a deterministic SSR seed; randomize after mount to avoid hydration mismatch.
  const [points, setPoints] = useState<number[]>(() =>
    Array.from({ length: 30 }, (_, i) => 12000 + Math.round(Math.sin(i / 3) * 3000 + i * 50)),
  );
  const [feed, setFeed] = useState<Deposit[]>(() =>
    SEED.slice(0, 6).map((s, i) => ({ ...s, id: i, ago: `${i + 1}s ago` })),
  );
  const [totalToday, setTotalToday] = useState(2_184_320);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setPoints((p) => {
        const next = [...p.slice(1), 10000 + Math.round(Math.random() * 9000)];
        return next;
      });
      const seed = SEED[Math.floor(Math.random() * SEED.length)];
      const d: Deposit = { ...seed, id: Date.now(), ago: "just now" };
      setFeed((f) => [d, ...f.slice(0, 5)].map((x, i) => ({ ...x, ago: i === 0 ? "just now" : `${i * 7}s ago` })));
      setTotalToday((v) => v + seed.amount);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  const total24h = useMemo(() => points.reduce((a, b) => a + b, 0) * 48, [points]);

  const max = Math.max(...points);
  const min = Math.min(...points);
  const w = 600;
  const h = 160;
  const step = w / (points.length - 1);
  const norm = (v: number) => h - ((v - min) / Math.max(1, max - min)) * (h - 16) - 8;
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${norm(v)}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  const lastY = norm(points[points.length - 1]);

  return (
    <section className="relative overflow-hidden border-y border-border/40">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0 bg-[image:var(--gradient-aurora)] opacity-60" />

      <div className="relative mx-auto max-w-7xl px-5 py-20 grid lg:grid-cols-2 gap-10 items-center">
        {/* LEFT — hero side: investor pitch + payment relief */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs uppercase tracking-widest text-success mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live · Investor activity
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.05]">
            Real money. <span className="gradient-text">Real payouts.</span> Right now.
          </h2>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl">
            Watch live deposits stream in from investors across 140+ countries — funding AI trading bots, mining rigs and staking pools. Every payout settles directly to your Binance wallet, on time, every cycle.
          </p>

          {/* Payment relief / trust badges */}
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            {[
              { i: <Wallet className="w-4 h-4" />, t: "0% deposit fee", d: "Top up from Binance, instantly." },
              { i: <Zap className="w-4 h-4" />, t: "Same-day withdrawals", d: "Funds back in your wallet in minutes." },
              { i: <ShieldCheck className="w-4 h-4" />, t: "Capital protected", d: "Stop-loss & drawdown caps on every bot." },
              { i: <BadgeCheck className="w-4 h-4" />, t: "100% on-chain proof", d: "Every payout has a verifiable TX hash." },
            ].map((b) => (
              <div key={b.t} className="glass rounded-xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-success/15 text-success flex items-center justify-center shrink-0">{b.i}</div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{b.t}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <CTA to="/register" variant="gold">Start investing now <ArrowUpRight className="w-4 h-4" /></CTA>
            <CTA to="/ai-trading" variant="ghost">Explore AI bots</CTA>
          </div>

          {/* Service quick-links */}
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {[
              { i: <Bot className="w-3.5 h-3.5" />, t: "AI Trading", to: "/ai-trading" },
              { i: <Cpu className="w-3.5 h-3.5" />, t: "Smart Mining", to: "/mining" },
              { i: <Lock className="w-3.5 h-3.5" />, t: "Staking Pool", to: "/staking" },
            ].map((s) => (
              <a key={s.t} href={s.to} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-foreground/90 hover:border-primary/40 transition">
                <span className="text-primary">{s.i}</span>
                {s.t}
              </a>
            ))}
          </div>
        </div>

        {/* RIGHT — live chart + live deposit feed */}
        <div className="relative">
          <div className="absolute -inset-10 bg-primary/15 blur-3xl rounded-full -z-10" />
          <div className="glass-strong rounded-3xl p-5 md:p-6 border border-primary/20 glow-primary">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Client deposits · last 30 min</p>
                <p className="text-2xl md:text-3xl font-bold mt-1">
                  <span className="gradient-text">${fmt(totalToday)}</span>
                  <span className="text-xs font-normal text-muted-foreground ml-2">today</span>
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs font-mono text-success">
                  <TrendingUp className="w-3.5 h-3.5" /> +{fmt(total24h / 1000)}K / 24h
                </span>
                <p className="text-[10px] text-muted-foreground mt-1">streaming live</p>
              </div>
            </div>

            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36 md:h-40">
              <defs>
                <linearGradient id="ld-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.78 0.16 80)" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="oklch(0.78 0.16 80)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ld-stroke" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="oklch(0.7 0.2 245)" />
                  <stop offset="100%" stopColor="oklch(0.78 0.16 80)" />
                </linearGradient>
              </defs>
              {/* gridlines */}
              {[0.25, 0.5, 0.75].map((g) => (
                <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="currentColor" className="text-border/40" strokeDasharray="3 5" />
              ))}
              <path d={area} fill="url(#ld-fill)" />
              <path d={path} fill="none" stroke="url(#ld-stroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={w} cy={lastY} r="4" fill="oklch(0.78 0.16 80)">
                <animate attributeName="r" values="4;8;4" dur="1.4s" repeatCount="indefinite" />
              </circle>
            </svg>

            {/* mini stats */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg glass p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active investors</p>
                <p className="text-sm font-bold mt-0.5">240,812</p>
              </div>
              <div className="rounded-lg glass p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid out 24h</p>
                <p className="text-sm font-bold mt-0.5 text-success">$1.84M</p>
              </div>
              <div className="rounded-lg glass p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg payout time</p>
                <p className="text-sm font-bold mt-0.5">3m 42s</p>
              </div>
            </div>

            {/* live deposit feed */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Live deposits</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> streaming
                </span>
              </div>
              <ul className="space-y-1.5">
                {feed.map((d, i) => (
                  <li
                    key={d.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs glass border-border/40 ${
                      i === 0 ? "border-success/40 bg-success/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base leading-none">{d.flag}</span>
                      <span className="font-mono text-foreground/90 truncate">{d.handle}</span>
                      <span className="hidden sm:inline px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px]">
                        {d.service}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-success">+${fmt(d.amount)}</span>
                      <span className="text-muted-foreground hidden md:inline">{d.ago}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
