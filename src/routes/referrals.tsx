import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cpu, Lock, Brain, Copy, Check, Users, TrendingUp, Wallet, Share2, ArrowUpRight, ExternalLink } from "lucide-react";
import { CTA, GlassCard, Section } from "@/components/ui-bits";

export const Route = createFileRoute("/referrals")({
  component: Referrals,
  head: () => ({ meta: [{ title: "Referral Dashboard — NovaVault" }] }),
});

const REFERRAL_ID = "a2891x";

const services = [
  {
    key: "ai-trading",
    name: "AI Trading",
    icon: <Brain className="w-5 h-5" />,
    accent: "primary" as const,
    href: "/ai-trading",
    direct: 14,
    network: 38,
    earned: 1284.42,
    perDay: 6.18,
    rates: { l1: "12%", l2: "5%", profit: "2%" },
  },
  {
    key: "mining",
    name: "Mining",
    icon: <Cpu className="w-5 h-5" />,
    accent: "primary" as const,
    href: "/mining",
    direct: 22,
    network: 71,
    earned: 2104.88,
    perDay: 9.74,
    rates: { l1: "8%", l2: "3%", profit: "1%" },
  },
  {
    key: "staking",
    name: "Staking",
    icon: <Lock className="w-5 h-5" />,
    accent: "gold" as const,
    href: "/staking",
    direct: 9,
    network: 24,
    earned: 642.10,
    perDay: 2.41,
    rates: { l1: "6%", l2: "2%", profit: "0.5%" },
  },
];

const totals = {
  direct: services.reduce((s, x) => s + x.direct, 0),
  network: services.reduce((s, x) => s + x.network, 0),
  earned: services.reduce((s, x) => s + x.earned, 0),
  perDay: services.reduce((s, x) => s + x.perDay, 0),
};

function Referrals() {
  // Live counter — accrues per-second based on combined daily rate.
  const perSecond = totals.perDay / 86400;
  const [live, setLive] = useState(totals.earned);
  useEffect(() => {
    const id = setInterval(() => setLive((v) => v + perSecond), 1000);
    return () => clearInterval(id);
  }, [perSecond]);

  return (
    <Section className="!py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground">Referral Dashboard</p>
          <h1 className="text-2xl md:text-3xl font-bold">Your <span className="gradient-text">network &amp; earnings</span></h1>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard" className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2">← Back to dashboard</Link>
          <Link to="/affiliate" className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2"><ExternalLink className="w-4 h-4 text-primary" /> Program rules</Link>
        </div>
      </div>

      {/* LIVE EARNINGS HERO */}
      <div className="relative rounded-3xl glass-strong p-6 md:p-8 overflow-hidden mb-6">
        <div className="absolute inset-0 bg-[image:var(--gradient-aurora)] opacity-50 pointer-events-none" />
        <div className="relative grid md:grid-cols-4 gap-5 items-center">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-primary mb-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs uppercase tracking-widest">Live commission earnings</span>
            </div>
            <p className="text-4xl md:text-5xl font-bold gradient-text font-mono tracking-tight">
              ${live.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Accruing at ${totals.perDay.toFixed(2)} / day · auto-paid daily to your Binance wallet.</p>
          </div>
          <SmallStat icon={<Users />} label="Direct (L1)" value={String(totals.direct)} sub="active referrals" />
          <SmallStat icon={<Users />} label="Network (L2)" value={String(totals.network)} sub="extended network" />
        </div>
      </div>

      {/* MASTER LINK */}
      <CopyLinkCard
        label="Master referral link"
        url={`https://novavault.io/r/${REFERRAL_ID}`}
        note="Shares all services. Use service-specific links below for higher conversion."
      />

      {/* PER-SERVICE GRID */}
      <h2 className="mt-10 mb-4 text-lg font-semibold">Per-service performance</h2>
      <div className="grid lg:grid-cols-3 gap-5">
        {services.map((s) => (
          <ServiceCard key={s.key} service={s} />
        ))}
      </div>

      {/* RECENT EVENTS */}
      <div className="mt-8 grid lg:grid-cols-3 gap-5">
        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold mb-4">Recent referral activity</h3>
          <ul className="space-y-3 text-sm">
            {[
              { who: "@cryptojay", act: "deposited into AI Trading — Premium", a: "+$28.80", time: "12m ago", svc: "AI Trading" },
              { who: "@nadia.k", act: "joined via your Mining link", a: "—", time: "1h ago", svc: "Mining" },
              { who: "L2 · @ahsan99", act: "staked 3-month tier", a: "+$4.20", time: "3h ago", svc: "Staking" },
              { who: "@miguel", act: "AI bot profit share", a: "+$11.62", time: "6h ago", svc: "AI Trading" },
              { who: "@rina.eth", act: "mining daily reward share", a: "+$2.04", time: "9h ago", svc: "Mining" },
              { who: "L2 · @tarek", act: "deposited into Mining — Advanced", a: "+$15.00", time: "1d ago", svc: "Mining" },
            ].map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2 border-b border-border/30 last:border-0">
                <div className="min-w-0">
                  <p className="font-medium truncate">{e.who} <span className="text-muted-foreground font-normal">{e.act}</span></p>
                  <p className="text-xs text-muted-foreground">{e.time} · {e.svc}</p>
                </div>
                <span className={e.a === "—" ? "text-muted-foreground text-xs" : "text-success font-medium font-mono whitespace-nowrap"}>{e.a}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-4">Payouts</h3>
          <div className="space-y-3 text-sm">
            <Row k="This month" v="$842.16" tone="text-success" />
            <Row k="Last month" v="$1,108.40" />
            <Row k="Lifetime" v={`$${totals.earned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} tone="text-success" />
            <Row k="Next payout" v="in 14h 22m" />
            <Row k="Method" v="Binance · USDT" />
          </div>
          <div className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowUpRight className="w-3.5 h-3.5 text-gold" /> Payouts settle automatically every 24h.
          </div>
        </GlassCard>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <CTA to="/affiliate" variant="gold">View commission rules</CTA>
        <CTA to="/dashboard" variant="ghost">Back to dashboard</CTA>
      </div>
    </Section>
  );
}

function ServiceCard({ service: s }: { service: typeof services[number] }) {
  const url = `https://novavault.io/r/${REFERRAL_ID}?p=${s.key}`;
  return (
    <div className={`relative rounded-2xl p-6 ${s.accent === "gold" ? "glass-strong border-primary/40 glow-gold" : "glass"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl ${s.accent === "gold" ? "bg-[image:var(--gradient-gold)] text-gold-foreground" : "bg-primary/15 text-primary"} flex items-center justify-center`}>{s.icon}</div>
          <div>
            <p className="font-semibold">{s.name}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">L1 {s.rates.l1} · L2 {s.rates.l2} · Share {s.rates.profit}</p>
          </div>
        </div>
        <Link to={s.href} className="text-xs text-primary hover:underline inline-flex items-center gap-1">View <ExternalLink className="w-3 h-3" /></Link>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Mini label="Direct" value={String(s.direct)} icon={<Users className="w-3.5 h-3.5" />} />
        <Mini label="Network" value={String(s.network)} icon={<Share2 className="w-3.5 h-3.5" />} />
        <Mini label="Per day" value={`$${s.perDay.toFixed(2)}`} icon={<TrendingUp className="w-3.5 h-3.5" />} />
      </div>

      <div className="rounded-xl bg-background/40 border border-border/40 p-3 mb-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Lifetime earned</p>
        <p className="text-2xl font-bold font-mono gradient-text">${s.earned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>

      <CopyLinkCard label={`${s.name} link`} url={url} compact />
    </div>
  );
}

function CopyLinkCard({ label, url, note, compact }: { label: string; url: string; note?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className={`rounded-xl glass ${compact ? "p-3" : "p-4"} flex items-center gap-3`}>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-xs sm:text-sm font-mono mt-0.5 truncate">{url}</p>
        {note && <p className="text-[11px] text-muted-foreground mt-1">{note}</p>}
      </div>
      <button
        onClick={copy}
        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${copied ? "bg-success/20 text-success" : "bg-primary text-primary-foreground glow-primary hover:opacity-90"}`}
      >
        {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
      </button>
    </div>
  );
}

function SmallStat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl glass p-4">
      <div className="flex items-center gap-2 text-primary"><div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">{icon}</div><span className="text-xs uppercase tracking-widest">{label}</span></div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Mini({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-background/30 border border-border/30 p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] uppercase tracking-widest">{icon}{label}</div>
      <p className="text-sm font-semibold mt-1">{value}</p>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-muted-foreground">{k}</span>
      <span className={`font-medium font-mono ${tone ?? ""}`}>{v}</span>
    </div>
  );
}
