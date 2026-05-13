import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Cpu, Lock, Brain, Shield, Zap, Globe, TrendingUp, Users, Bitcoin, Sparkles, Bot, LineChart, Coins, BadgeCheck, Headphones } from "lucide-react";
import heroImg from "@/assets/hero-crypto.jpg";
import miningImg from "@/assets/mining-visual.jpg";
import stakingImg from "@/assets/staking-visual.jpg";
import aiImg from "@/assets/ai-trading.jpg";
import { CTA, GlassCard, Section, StatPill } from "@/components/ui-bits";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "NovaVault — Crypto Mining, Staking & AI Trading Platform" },
      { name: "description", content: "Earn daily crypto rewards through smart mining, flexible staking and AI-assisted trading. Built for Binance users and global investors." },
    ],
  }),
});

function Home() {
  return (
    <>
      {/* SERVICES STRIP — above hero */}
      <section className="relative border-b border-border/40 bg-background/60">
        <div className="mx-auto max-w-7xl py-6 md:py-8">
          <div className="flex sm:grid sm:grid-cols-3 gap-3 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scroll-px-5 px-5 pb-2 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link to="/mining" style={{ animationDelay: "0ms" }} className="group glass animate-rise rounded-2xl p-4 flex items-center gap-3 border border-transparent hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-500 ease-out shrink-0 w-[80%] sm:w-auto snap-start">
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 transition-colors duration-500 group-hover:bg-primary/25"><Cpu className="w-5 h-5" /></div>
              <div className="min-w-0">
                <p className="text-sm font-semibold flex items-center gap-1.5">Smart Mining <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition duration-300" /></p>
                <p className="text-xs text-muted-foreground truncate">Up to 2.4% daily rewards</p>
              </div>
            </Link>
            <Link to="/staking" style={{ animationDelay: "120ms" }} className="group glass animate-rise rounded-2xl p-4 flex items-center gap-3 border border-transparent hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-500 ease-out shrink-0 w-[80%] sm:w-auto snap-start">
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 transition-colors duration-500 group-hover:bg-primary/25"><Lock className="w-5 h-5" /></div>
              <div className="min-w-0">
                <p className="text-sm font-semibold flex items-center gap-1.5">Binance Staking <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition duration-300" /></p>
                <p className="text-xs text-muted-foreground truncate">Up to 38% APY locked</p>
              </div>
            </Link>
            <Link to="/ai-trading" style={{ animationDelay: "240ms" }} className="group glass animate-rise rounded-2xl p-4 flex items-center gap-3 border border-transparent hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-500 ease-out shrink-0 w-[80%] sm:w-auto snap-start">
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 transition-colors duration-500 group-hover:bg-primary/25"><Brain className="w-5 h-5" /></div>
              <div className="min-w-0">
                <p className="text-sm font-semibold flex items-center gap-1.5">AI Trading <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition duration-300" /></p>
                <p className="text-xs text-muted-foreground truncate">24/7 automated bots</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute inset-0 bg-[image:var(--gradient-aurora)]" />
        <div className="relative mx-auto max-w-7xl px-5 pt-16 md:pt-24 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs uppercase tracking-widest text-primary mb-6">
              <Sparkles className="w-3 h-3" /> Trusted by 240k+ investors worldwide
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              The future of <span className="gradient-text">crypto investing</span> is intelligent.
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl">
              NovaVault unifies mining, Binance-style staking and AI-assisted trading into one premium dashboard — designed for serious investors and the global crypto community.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CTA to="/register">Start investing <ArrowRight className="w-4 h-4" /></CTA>
              <CTA to="/mining" variant="ghost">Explore plans</CTA>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
              <StatPill label="AUM" value="$1.2B+" />
              <StatPill label="Daily Rewards" value="$840k" />
              <StatPill label="Uptime" value="99.99%" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 bg-primary/20 blur-3xl rounded-full -z-10" />
            <div className="relative rounded-3xl overflow-hidden border border-border/60 glow-primary">
              <img src={heroImg} alt="Crypto trading visualization" width={1920} height={1080} className="w-full h-auto" />
            </div>
            <FloatingCard className="absolute -left-4 -bottom-4 hidden md:block" icon={<TrendingUp className="text-success" />} label="BTC / 24h" value="+4.82%" />
            <FloatingCard className="absolute -right-4 -top-6 hidden md:block" icon={<Bot className="text-primary" />} label="AI Bot" value="Active" />
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-border/40 bg-background/40">
        <div className="mx-auto max-w-7xl px-5 py-6 flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm text-muted-foreground">
          {["Binance Compatible", "ISO 27001", "SOC 2 Audited", "AES-256 Encryption", "Cold Wallet Storage"].map((t) => (
            <div key={t} className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-primary" />{t}</div>
          ))}
        </div>
      </section>

      {/* THREE PILLARS */}
      <Section
        eyebrow="Core platform"
        title={<>Three engines. <span className="gradient-text">One vault.</span></>}
        subtitle="Diversify your crypto across mining, staking and AI trading — managed seamlessly from a single account."
      >
        <div className="grid md:grid-cols-3 gap-5">
          <PillarCard
            img={miningImg}
            icon={<Cpu className="w-5 h-5" />}
            title="Smart Mining"
            desc="Invest in next-gen mining infrastructure and earn daily crypto rewards distributed automatically."
            href="/mining"
            stat="Up to 2.4% daily"
          />
          <PillarCard
            img={stakingImg}
            icon={<Lock className="w-5 h-5" />}
            title="Binance-Style Staking"
            desc="Lock your assets for 1, 3, 6 or 12 months and watch your portfolio compound."
            href="/staking"
            stat="Up to 38% APY"
          />
          <PillarCard
            img={aiImg}
            icon={<Brain className="w-5 h-5" />}
            title="AI Trading"
            desc="Automated market analysis powered by neural networks scanning hundreds of pairs in real time."
            href="/ai-trading"
            stat="24/7 Auto Bots"
          />
        </div>
      </Section>

      {/* FEATURES */}
      <Section
        eyebrow="Why NovaVault"
        title={<>Built like a fintech. <span className="gradient-text">Secured like a bank.</span></>}
        subtitle="Engineered with institutional-grade security, fast deposits & withdrawals, and a premium dashboard experience."
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

      {/* DASHBOARD PREVIEW */}
      <Section
        eyebrow="Dashboard"
        title={<>A control room for your <span className="gradient-text">portfolio</span></>}
        subtitle="Track balances, active investments, daily rewards and withdrawals in real time — across desktop and mobile."
      >
        <div className="relative rounded-3xl overflow-hidden glass-strong p-2 md:p-3 glow-primary">
          <div className="rounded-2xl bg-background/80 p-5 md:p-8 grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 grid gap-5">
              <div className="grid grid-cols-3 gap-3">
                <MiniStat label="Total Balance" value="$48,920.30" trend="+12.4%" />
                <MiniStat label="Active Plans" value="6" trend="+2 this week" />
                <MiniStat label="Daily Earnings" value="$382.10" trend="+8.1%" />
              </div>
              <div className="rounded-xl glass p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold">Portfolio Performance</p>
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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="relative overflow-hidden rounded-3xl glass-strong p-10 md:p-16 text-center glow-primary">
          <div className="absolute inset-0 bg-[image:var(--gradient-aurora)] opacity-70" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Start growing your <span className="gradient-text">crypto today</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Join 240,000+ investors earning daily passive income with NovaVault.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <CTA to="/register" variant="gold">Create free account</CTA>
              <CTA to="/contact" variant="ghost">Talk to sales</CTA>
            </div>
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
  { icon: <TrendingUp />, title: "Live Earnings", desc: "Watch profits accrue with a real-time counter synced to USA timezone distributions." },
  { icon: <Users />, title: "Referral Rewards", desc: "Earn lifetime commissions across 3 levels by inviting friends to NovaVault." },
  { icon: <Headphones />, title: "24/7 Support", desc: "Dedicated support team and Telegram & Discord communities ready to help." },
];

function PillarCard({ img, icon, title, desc, href, stat }: { img: string; icon: React.ReactNode; title: string; desc: string; href: string; stat: string }) {
  return (
    <Link to={href} className="group relative block rounded-2xl overflow-hidden glass hover:border-primary/40 transition">
      <div className="relative h-44 overflow-hidden">
        <img src={img} alt={title} loading="lazy" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <span className="absolute top-3 right-3 glass px-2.5 py-1 rounded-full text-[11px] font-medium text-primary">{stat}</span>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 text-primary mb-3">{icon}<span className="text-xs uppercase tracking-widest">Pillar</span></div>
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
  // Simple SVG sparkline
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
