import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Cpu, Lock, Brain, Shield, Zap, Globe, TrendingUp, Users, Sparkles, Bot, BadgeCheck, Headphones, Activity, LineChart, Cable, AlertTriangle, ShieldCheck, CircleDollarSign, Eye, ArrowUpRight, ArrowDownRight } from "lucide-react";
import heroImg from "@/assets/ai-trader-bot.png";
import miningImg from "@/assets/mining-visual.jpg";
import stakingImg from "@/assets/staking-visual.jpg";
import { CTA, GlassCard, Section, StatPill } from "@/components/ui-bits";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "NovaVault — AI Crypto Trading, Mining & Staking Platform" },
      { name: "description", content: "AI-powered crypto trading bots running 24/7. Plus mining and staking. Built for Binance users worldwide." },
    ],
  }),
});

function Home() {
  return (
    <>
      {/* AI TRADING HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute inset-0 bg-[image:var(--gradient-aurora)]" />

        {/* Live ticker tape */}
        <TickerTape />

        <div className="relative mx-auto max-w-7xl px-5 pt-10 md:pt-14 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs uppercase tracking-widest text-primary mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live · AI trading desk open
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Trade smarter with <span className="gradient-text">AI that protects</span> your capital.
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl">
              NovaVault's neural trading engine scans 300+ Binance pairs every second and only takes high-probability setups — with hard stop-loss, drawdown caps and capital-protection rules baked in. Your funds stay yours.
            </p>

            {/* Trust badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { i: <ShieldCheck className="w-3.5 h-3.5" />, t: "Capital protection on" },
                { i: <Lock className="w-3.5 h-3.5" />, t: "Funds in your Binance wallet" },
                { i: <Eye className="w-3.5 h-3.5" />, t: "100% transparent trades" },
                { i: <CircleDollarSign className="w-3.5 h-3.5" />, t: "No hidden fees" },
              ].map((b) => (
                <span key={b.t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-[11px] font-medium text-foreground/90 border border-success/20">
                  <span className="text-success">{b.i}</span>{b.t}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <CTA to="/register">Activate AI Bot <ArrowRight className="w-4 h-4" /></CTA>
              <CTA to="/ai-trading" variant="ghost">See live performance</CTA>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
              <StatPill label="Avg Win Rate" value="74%" />
              <StatPill label="Max Drawdown" value="2.1%" />
              <StatPill label="Uptime" value="99.99%" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 bg-[image:var(--gradient-aurora)] opacity-60 blur-3xl rounded-full -z-10" />
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-10" />
            <div className="relative">
              <img src={heroImg} alt="NovaVault AI trading bot avatar" width={1024} height={1024} className="w-full h-auto drop-shadow-[0_30px_60px_rgba(56,189,248,0.35)]" />
              {/* Trading terminal overlay */}
              <div className="absolute inset-x-4 bottom-4 glass-strong rounded-2xl p-4 border border-primary/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">BTC/USDT · AI Live</span>
                  </div>
                  <span className="text-xs text-success font-mono">+1.84% / 24h</span>
                </div>
                <AILiveChart />
                <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-mono">
                  <div className="rounded-md bg-success/10 border border-success/20 px-2 py-1.5">
                    <p className="text-muted-foreground uppercase tracking-wider">Entry</p>
                    <p className="text-success">68,420.50</p>
                  </div>
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-2 py-1.5">
                    <p className="text-muted-foreground uppercase tracking-wider">Stop-loss</p>
                    <p className="text-destructive">67,950.00</p>
                  </div>
                  <div className="rounded-md bg-primary/10 border border-primary/20 px-2 py-1.5">
                    <p className="text-muted-foreground uppercase tracking-wider">Target</p>
                    <p className="text-primary">69,810.00</p>
                  </div>
                </div>
              </div>
            </div>
            <FloatingCard className="absolute -left-4 -top-6 hidden md:flex" icon={<Bot className="text-primary" />} label="DeepGrid AI" value="Executing" />
            <FloatingCard className="absolute -right-4 -bottom-2 hidden md:flex" icon={<ShieldCheck className="text-success" />} label="Risk guard" value="Active" />
          </div>
        </div>
      </section>

      {/* SAFETY STRIP — capital protection */}
      <section className="border-y border-success/30 bg-success/5">
        <div className="mx-auto max-w-7xl px-5 py-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { i: <ShieldCheck className="w-4 h-4" />, t: "Auto stop-loss on every trade", d: "Losses are capped, never catastrophic." },
            { i: <Lock className="w-4 h-4" />, t: "Non-custodial flow", d: "Your capital stays in your own Binance wallet." },
            { i: <Eye className="w-4 h-4" />, t: "Full audit log", d: "Every AI trade is visible in your dashboard." },
            { i: <BadgeCheck className="w-4 h-4" />, t: "No harmful strategies", d: "No martingale, no over-leverage, no rugs." },
          ].map((x) => (
            <div key={x.t} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-success/15 text-success flex items-center justify-center shrink-0">{x.i}</div>
              <div>
                <p className="text-sm font-semibold leading-tight">{x.t}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{x.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BINANCE REQUIREMENT NOTICE */}
      <section className="border-y border-primary/30 bg-primary/5">
        <div className="mx-auto max-w-7xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[image:var(--gradient-gold)] text-gold-foreground flex items-center justify-center shrink-0">
              <Cable className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">A Binance account is required to join NovaVault.</p>
              <p className="text-xs text-muted-foreground mt-0.5">All deposits, withdrawals and reward payouts are processed through your verified Binance wallet.</p>
            </div>
          </div>
          <a href="https://accounts.binance.com/register" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline shrink-0">Create Binance account →</a>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-b border-border/40 bg-background/40">
        <div className="mx-auto max-w-7xl px-5 py-6 flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm text-muted-foreground">
          {["Binance Compatible", "ISO 27001", "SOC 2 Audited", "AES-256 Encryption", "Cold Wallet Storage"].map((t) => (
            <div key={t} className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-primary" />{t}</div>
          ))}
        </div>
      </section>

      {/* AI TRADING DEEP-DIVE */}
      <Section
        eyebrow="Why AI Trading"
        title={<>Smart. Automated. <span className="gradient-text">Always on.</span></>}
        subtitle="Our neural engine combines deep market analysis with disciplined risk management — engineered for Binance markets and tuned 24/7."
      >
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { i: <Brain />, t: "Neural Market Analysis", d: "Deep models track liquidity, volatility and sentiment across 300+ Binance pairs every second." },
            { i: <Bot />, t: "Auto Execution", d: "Bots open, manage and close positions automatically with sub-second routing." },
            { i: <Shield />, t: "Risk Controls", d: "Built-in stop-loss, drawdown caps, position limits and per-strategy risk budgeting." },
            { i: <LineChart />, t: "Transparent Stats", d: "Live win rate, ROI and trade history streamed straight to your dashboard." },
            { i: <Zap />, t: "Low Latency", d: "Co-located infrastructure for fast fills on volatile market moves." },
            { i: <Activity />, t: "Multi-Strategy", d: "Run arbitrage, momentum and grid strategies in parallel — diversified by design." },
          ].map((f) => (
            <GlassCard key={f.t}>
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-4">{f.i}</div>
              <h3 className="font-semibold text-lg">{f.t}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.d}</p>
            </GlassCard>
          ))}
        </div>
        <div className="mt-8 text-center">
          <CTA to="/ai-trading" variant="gold">See AI strategies <ArrowRight className="w-4 h-4" /></CTA>
        </div>
      </Section>

      {/* OTHER SERVICES — numbered 01, 02 */}
      <Section
        eyebrow="Also available"
        title={<>Other ways to <span className="gradient-text">grow your crypto</span></>}
        subtitle="Beyond AI trading, NovaVault offers two additional passive-income streams."
      >
        <div className="grid md:grid-cols-2 gap-5">
          <NumberedService
            n="01"
            img={miningImg}
            icon={<Cpu className="w-5 h-5" />}
            title="Smart Mining"
            desc="Invest in next-gen mining infrastructure and earn daily crypto rewards distributed automatically to your Binance wallet."
            href="/mining"
            stat="Up to 2.4% daily"
          />
          <NumberedService
            n="02"
            img={stakingImg}
            icon={<Lock className="w-5 h-5" />}
            title="Binance-Style Staking"
            desc="Lock your assets for 1, 3, 6 or 12 months and watch your portfolio compound with flexible APY tiers."
            href="/staking"
            stat="Up to 38% APY"
          />
        </div>
      </Section>

      {/* DASHBOARD PREVIEW */}
      <Section
        eyebrow="Dashboard"
        title={<>A control room for your <span className="gradient-text">portfolio</span></>}
        subtitle="Track AI bot performance, balances, daily rewards and withdrawals — across desktop and mobile."
      >
        <div className="relative rounded-3xl overflow-hidden glass-strong p-2 md:p-3 glow-primary">
          <div className="rounded-2xl bg-background/80 p-5 md:p-8 grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 grid gap-5">
              <div className="grid grid-cols-3 gap-3">
                <MiniStat label="AI Profit" value="$11,284" trend="+12.4%" />
                <MiniStat label="Active Bots" value="3" trend="All running" />
                <MiniStat label="Daily Earnings" value="$382.10" trend="+8.1%" />
              </div>
              <div className="rounded-xl glass p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold">AI Strategy Performance</p>
                  <span className="text-xs text-success">+24.8% / 30d</span>
                </div>
                <FakeChart />
              </div>
            </div>
            <div className="grid gap-3">
              {[
                { c: "BTC", n: "Bitcoin", v: "$24,180", d: "+3.2%" },
                { c: "ETH", n: "Ethereum", v: "$12,420", d: "+1.8%" },
                { c: "SOL", n: "Solana", v: "$6,810", d: "+5.4%" },
                { c: "BNB", n: "BNB", v: "$5,510", d: "+0.9%" },
              ].map((a) => (
                <div key={a.c} className="rounded-xl glass p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[image:var(--gradient-gold)] text-gold-foreground flex items-center justify-center text-xs font-bold">{a.c}</div>
                    <div>
                      <p className="text-sm font-medium">{a.n}</p>
                      <p className="text-xs text-muted-foreground">{a.c}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{a.v}</p>
                    <p className="text-xs text-success">{a.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* FEATURES */}
      <Section
        eyebrow="Why NovaVault"
        title={<>Built like a fintech. <span className="gradient-text">Secured like a bank.</span></>}
        subtitle="Engineered with institutional-grade security, fast Binance-linked deposits & withdrawals, and a premium dashboard experience."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <GlassCard key={f.title}>
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="relative overflow-hidden rounded-3xl glass-strong p-10 md:p-16 text-center glow-primary">
          <div className="absolute inset-0 bg-[image:var(--gradient-aurora)] opacity-70" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Activate your <span className="gradient-text">AI bot today</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Join 240,000+ Binance users earning passive income with NovaVault's neural trading engine.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <CTA to="/register" variant="gold">Create free account</CTA>
              <CTA to="/contact" variant="ghost">Talk to sales</CTA>
            </div>
            <p className="mt-4 text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Binance account required for all withdrawals.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

const features = [
  { icon: <Shield />, title: "Bank-grade Security", desc: "Multi-sig cold storage, AES-256 encryption and 24/7 monitoring keep your funds protected." },
  { icon: <Zap />, title: "Lightning Deposits", desc: "Crypto deposits confirm in minutes via direct Binance-compatible wallet integration." },
  { icon: <Globe />, title: "Global Coverage", desc: "Trusted by investors across 140+ countries with English-first, mobile-friendly UX." },
  { icon: <TrendingUp />, title: "Live Earnings", desc: "Watch profits accrue with a real-time counter synced to your dashboard." },
  { icon: <Users />, title: "Referral Rewards", desc: "Earn lifetime commissions across 3 levels by inviting friends to NovaVault." },
  { icon: <Headphones />, title: "24/7 Support", desc: "Dedicated support team and Telegram & Discord communities ready to help." },
];

function NumberedService({ n, img, icon, title, desc, href, stat }: { n: string; img: string; icon: React.ReactNode; title: string; desc: string; href: string; stat: string }) {
  return (
    <Link to={href} className="group relative block rounded-2xl overflow-hidden glass hover:border-primary/40 transition">
      <div className="relative h-44 overflow-hidden">
        <img src={img} alt={title} loading="lazy" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <span className="absolute top-3 right-3 glass px-2.5 py-1 rounded-full text-[11px] font-medium text-primary">{stat}</span>
        <span className="absolute top-3 left-3 font-mono text-xs tracking-widest text-muted-foreground">/ {n}</span>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 text-primary mb-3">{icon}<span className="text-xs uppercase tracking-widest">Service {n}</span></div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{desc}</p>
        <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary group-hover:gap-2.5 transition-all">
          Learn more <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

function FloatingCard({ icon, label, value, className = "" }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className={`glass-strong rounded-2xl p-4 flex items-center gap-3 animate-float ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-card/60 flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="rounded-xl glass p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg md:text-xl font-bold mt-1">{value}</p>
      <p className="text-xs text-success mt-0.5">{trend}</p>
    </div>
  );
}

function FakeChart() {
  const pts = [40, 55, 48, 62, 58, 70, 64, 78, 72, 85, 80, 92, 88, 100, 95, 112];
  const max = Math.max(...pts);
  const w = 600, h = 140;
  const step = w / (pts.length - 1);
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
      <defs>
        <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.7 0.2 245)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="oklch(0.7 0.2 245)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#fill)" />
      <path d={path} fill="none" stroke="oklch(0.78 0.16 80)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AILiveChart() {
  // Animated AI strategy candle-ish bars + pulse line
  const pts = [22, 30, 26, 38, 34, 46, 42, 54, 50, 62, 58, 70];
  const w = 320, h = 60;
  const step = w / (pts.length - 1);
  const max = Math.max(...pts);
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`).join(" ");
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14">
        <defs>
          <linearGradient id="ai-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.16 80)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="oklch(0.78 0.16 80)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#ai-fill)" />
        <path d={path} fill="none" stroke="oklch(0.78 0.16 80)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={w} cy={h - (pts[pts.length - 1] / max) * h} r="3" fill="oklch(0.78 0.16 80)">
          <animate attributeName="r" values="3;6;3" dur="1.4s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

function TickerTape() {
  const tickers = [
    { s: "BTC/USDT", p: "68,420.50", d: "+1.84%", up: true },
    { s: "ETH/USDT", p: "3,842.10", d: "+2.41%", up: true },
    { s: "SOL/USDT", p: "182.34", d: "+5.12%", up: true },
    { s: "BNB/USDT", p: "612.80", d: "+0.92%", up: true },
    { s: "XRP/USDT", p: "0.6240", d: "-0.31%", up: false },
    { s: "DOGE/USDT", p: "0.1582", d: "+3.74%", up: true },
    { s: "ADA/USDT", p: "0.4612", d: "-0.84%", up: false },
    { s: "AVAX/USDT", p: "38.42", d: "+2.18%", up: true },
    { s: "MATIC/USDT", p: "0.7184", d: "+1.05%", up: true },
    { s: "LINK/USDT", p: "16.92", d: "+4.22%", up: true },
  ];
  const row = [...tickers, ...tickers];
  return (
    <div className="relative border-y border-border/40 bg-background/60 backdrop-blur-sm overflow-hidden">
      <div className="flex animate-[ticker_45s_linear_infinite] whitespace-nowrap py-2.5">
        {row.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-5 text-xs font-mono shrink-0">
            <span className="font-semibold text-foreground/90">{t.s}</span>
            <span className="text-muted-foreground">{t.p}</span>
            <span className={`inline-flex items-center gap-0.5 ${t.up ? "text-success" : "text-destructive"}`}>
              {t.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {t.d}
            </span>
            <span className="text-border">·</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
