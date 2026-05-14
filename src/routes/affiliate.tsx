import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Gift, TrendingUp, Cpu, Lock, Brain, Wallet, Share2, Trophy, Check } from "lucide-react";
import { CTA, GlassCard, PageHero, Section } from "@/components/ui-bits";

export const Route = createFileRoute("/affiliate")({
  component: Affiliate,
  head: () => ({
    meta: [
      { title: "Affiliate & Referral Commissions — NovaVault" },
      { name: "description", content: "Earn lifetime crypto commissions per service — Mining, Staking and AI Trading — across 3 referral tiers, paid daily to your Binance wallet." },
    ],
  }),
});

const services = [
  {
    name: "AI Trading",
    icon: <Brain className="w-5 h-5" />,
    href: "/ai-trading",
    accent: "primary" as const,
    l1: "12%",
    l2: "5%",
    profit: "2% of net trading profit",
    tag: "Highest payout",
  },
  {
    name: "Mining",
    icon: <Cpu className="w-5 h-5" />,
    href: "/mining",
    accent: "primary" as const,
    l1: "8%",
    l2: "3%",
    profit: "1% of daily mining rewards",
    tag: "Most popular",
  },
  {
    name: "Staking",
    icon: <Lock className="w-5 h-5" />,
    href: "/staking",
    accent: "gold" as const,
    l1: "6%",
    l2: "2%",
    profit: "0.5% of daily staking rewards",
    tag: "Lowest risk",
  },
];

function Affiliate() {
  return (
    <>
      <PageHero
        eyebrow="Affiliate · Referral Marketing"
        title={<>Build your network. <span className="gradient-text">Earn for life.</span></>}
        subtitle="Every NovaVault service has its own referral commission. Share, refer, and earn lifetime crypto rewards paid daily to your Binance wallet."
      />

      {/* HOW IT WORKS */}
      <Section eyebrow="How it works" title={<>Three steps to <span className="gradient-text">passive crypto income</span></>}>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { i: <Share2 />, t: "1. Share your link", d: "Get a unique referral link for each NovaVault service from your dashboard." },
            { i: <Users />, t: "2. They invest", d: "When your friends register and invest in any service, they're permanently linked to your network." },
            { i: <Wallet />, t: "3. You earn — daily", d: "Commissions are auto-paid to your Binance wallet every 24 hours, for life." },
          ].map((s) => (
            <GlassCard key={s.t}>
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-3">{s.i}</div>
              <h3 className="font-semibold text-lg">{s.t}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{s.d}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      {/* PER-SERVICE COMMISSION */}
      <Section
        eyebrow="Per-service commissions"
        title={<>Each service has its <span className="gradient-text">own payout structure</span></>}
        subtitle="Pick the program that fits your audience — or promote all three. Commissions stack across services for the same referral."
      >
        <div className="grid md:grid-cols-3 gap-5">
          {services.map((s) => (
            <div key={s.name} className={`relative rounded-2xl p-6 ${s.accent === "gold" ? "glass-strong border-primary/40 glow-gold" : "glass"}`}>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-medium bg-[image:var(--gradient-gold)] text-gold-foreground">{s.tag}</span>
              <div className="flex items-center gap-2 text-primary mb-4">
                <div className={`w-10 h-10 rounded-xl ${s.accent === "gold" ? "bg-[image:var(--gradient-gold)] text-gold-foreground" : "bg-primary/15 text-primary"} flex items-center justify-center`}>{s.icon}</div>
                <span className="text-sm font-semibold">{s.name}</span>
              </div>
              <div className="space-y-3 text-sm">
                <Row label="Direct (L1)" value={s.l1} highlight />
                <Row label="Network (L2)" value={s.l2} />
                <Row label="Reward share" value={s.profit} small />
                <Row label="Cookie window" value="Lifetime" />
                <Row label="Payout" value="Daily · Binance" />
              </div>
              <div className="mt-6 flex gap-2">
                <Link to={s.href} className="flex-1 inline-flex items-center justify-center px-3 py-2.5 rounded-xl glass text-sm font-medium hover:border-primary/30 transition">View {s.name}</Link>
                <Link to="/register" className="flex-1 inline-flex items-center justify-center px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-primary">Refer</Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* PERKS */}
      <Section eyebrow="Perks" title={<>More than <span className="gradient-text">commissions</span></>}>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { i: <Gift />, t: "VIP Bonuses", d: "Unlock seasonal bonuses, prize draws and milestone rewards as your network grows." },
            { i: <Trophy />, t: "Live Leaderboard", d: "Compete monthly for top affiliate spots with public rankings and cash prizes." },
            { i: <TrendingUp />, t: "Marketing Kit", d: "Banners, videos, copy and per-service tracking links to share across channels." },
          ].map((p) => (
            <GlassCard key={p.t}>
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-3">{p.i}</div>
              <h3 className="font-semibold">{p.t}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{p.d}</p>
            </GlassCard>
          ))}
        </div>
        <div className="mt-10 text-center">
          <CTA to="/register" variant="gold">Join the program</CTA>
        </div>
      </Section>

      {/* TERMS */}
      <Section eyebrow="Fine print" title={<>Simple, <span className="gradient-text">transparent rules</span></>}>
        <GlassCard>
          <ul className="grid md:grid-cols-2 gap-3 text-sm">
            {[
              "Referrals are linked for life — no cookie expiry, no resets.",
              "Commissions paid daily in USDT to your verified Binance wallet.",
              "Stack across services — your referral can earn in mining + staking + AI trading.",
              "Self-referrals and fraudulent signups are voided automatically.",
              "Minimum payout: $5 USDT equivalent. No upper limit.",
              "Real-time dashboard with referral activity, conversions and earnings.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /><span className="text-muted-foreground">{t}</span></li>
            ))}
          </ul>
        </GlassCard>
      </Section>
    </>
  );
}

function Row({ label, value, highlight, small }: { label: string; value: string; highlight?: boolean; small?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
      <span className={`font-semibold ${highlight ? "text-2xl gradient-text" : small ? "text-xs text-right" : "text-sm"}`}>{value}</span>
    </div>
  );
}
