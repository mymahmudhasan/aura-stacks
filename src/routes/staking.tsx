import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, TrendingUp, Timer, Layers, Gift, Zap, Sparkles, Flame, BadgePercent, Crown } from "lucide-react";
import { CTA, GlassCard, PageHero, Section } from "@/components/ui-bits";
import { InvestButton } from "@/components/InvestButton";
import { ServiceReferral } from "@/components/ServiceReferral";
import { StakingTimeline } from "@/components/StakingTimeline";
import { StakingPool } from "@/components/StakingPool";
import { listPlans } from "@/lib/plans.functions";
import stakingImg from "@/assets/staking-visual.webp";
import vaultImg from "@/assets/staking-vault.webp";
import poolImg from "@/assets/staking-pool.webp";
import rewardsImg from "@/assets/staking-rewards.webp";

export const Route = createFileRoute("/staking")({
  component: Staking,
  head: () => ({
    meta: [
      { title: "Staking Plans & Offers — AuraTrad.Ai" },
      { name: "description", content: "Lock, stake and earn daily rewards. Limited-time bonus APY offers, new-investor boost and VIP staking from $50 to $2,500+." },
    ],
  }),
});

type DBPlan = {
  id: string; name: string;
  min_amount: number | string; apy_pct: number | string | null;
  duration_days: number | null; flex: string | null;
  is_popular: boolean; badge: string | null;
};

const offers = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    badge: "New investor",
    title: "+3% Welcome APY Boost",
    desc: "First-time stakers get an extra 3% APY for the first 30 days on any plan. Auto-applied at first stake.",
    accent: "primary" as const,
    cta: "Claim boost",
  },
  {
    icon: <Crown className="w-5 h-5" />,
    badge: "VIP · 12 month",
    title: "Lock $5,000+ → 42% APY",
    desc: "Premium tier upgrade with priority withdrawals, dedicated manager and free monthly compounding.",
    accent: "gold" as const,
    cta: "Go VIP",
  },
  {
    icon: <Flame className="w-5 h-5" />,
    badge: "Limited · 7 days",
    title: "Double Daily Rewards",
    desc: "Stake any USDT plan this week and receive 2× daily payouts for the first 14 days. Stackable with welcome boost.",
    accent: "primary" as const,
    cta: "Activate offer",
  },
  {
    icon: <Gift className="w-5 h-5" />,
    badge: "Refer & earn",
    title: "$25 Bonus per Friend",
    desc: "Get $25 USDT credited instantly when a referred friend stakes $500+. Unlimited referrals.",
    accent: "gold" as const,
    cta: "Get my link",
  },
];

function Staking() {
  const [tiers, setTiers] = useState<DBPlan[]>([]);
  useEffect(() => {
    listPlans({ data: { service: "staking" } }).then((d) => setTiers(d as unknown as DBPlan[])).catch(() => {});
  }, []);
  return (
    <>
      <PageHero
        eyebrow="Staking"
        title={<>Lock, stake and <span className="gradient-text">earn daily rewards</span></>}
        subtitle="Grow your crypto assets with flexible staking opportunities designed for modern investors. Inspired by Binance Earn and DeFi best practices."
      />

      <Section>
        <div className="grid md:grid-cols-3 gap-5 -mt-8">
          {[
            { i: <TrendingUp />, t: "Up to 38% APY", d: "Tiered rewards across BTC, ETH, USDT, BNB and more." },
            { i: <Timer />, t: "Daily commission", d: "Auto-credited to your wallet every 24 hours." },
            { i: <Layers />, t: "Compound rewards", d: "Reinvest automatically to maximize returns." },
          ].map((f) => (
            <GlassCard key={f.t}>
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-3">{f.i}</div>
              <h3 className="font-semibold">{f.t}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{f.d}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      {/* Visual showcase */}
      <Section eyebrow="Inside the vault" title={<>Where your <span className="gradient-text">capital works</span> for you</>} subtitle="Multi-chain staking pools secured by institutional-grade custody. Watch your assets grow in real time.">
        <div className="grid md:grid-cols-3 gap-5">
          <div className="relative rounded-3xl overflow-hidden border border-border/60 group">
            <img src={vaultImg} alt="Multi-asset crypto vault" loading="lazy" width={1280} height={896} className="w-full h-64 object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute bottom-0 p-5">
              <p className="text-xs uppercase tracking-widest text-primary">Multi-asset</p>
              <h3 className="text-xl font-bold mt-1">BTC · ETH · USDT · BNB</h3>
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden border border-border/60 group glow-gold">
            <img src={poolImg} alt="Live staking pool" loading="lazy" width={1280} height={896} className="w-full h-64 object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute bottom-0 p-5">
              <p className="text-xs uppercase tracking-widest text-gold">Live pool</p>
              <h3 className="text-xl font-bold mt-1">$284M+ TVL</h3>
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden border border-border/60 group">
            <img src={rewardsImg} alt="Daily reward unlock" loading="lazy" width={1280} height={896} className="w-full h-64 object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute bottom-0 p-5">
              <p className="text-xs uppercase tracking-widest text-primary">Daily unlock</p>
              <h3 className="text-xl font-bold mt-1">Rewards every 24h</h3>
            </div>
          </div>
        </div>
      </Section>

      {/* Limited offers */}
      <Section eyebrow="Live offers" title={<>Limited-time <span className="gradient-text">staking offers</span></>} subtitle="Stack these promos with any plan to maximize your APY. Offers refresh weekly.">
        <div className="grid sm:grid-cols-2 gap-5">
          {offers.map((o) => (
            <div key={o.title} className={`relative rounded-2xl p-6 overflow-hidden ${o.accent === "gold" ? "glass-strong border-gold/30" : "glass"}`}>
              <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-30 ${o.accent === "gold" ? "bg-[image:var(--gradient-gold)]" : "bg-primary"}`} />
              <div className="relative flex items-start gap-4">
                <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${o.accent === "gold" ? "bg-[image:var(--gradient-gold)] text-gold-foreground" : "bg-primary/15 text-primary"}`}>
                  {o.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${o.accent === "gold" ? "bg-gold/15 text-gold border border-gold/20" : "bg-primary/15 text-primary border border-primary/20"}`}>
                    <BadgePercent className="w-3 h-3" /> {o.badge}
                  </span>
                  <h3 className="text-lg md:text-xl font-bold mt-2">{o.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{o.desc}</p>
                  <CTA to="/register" variant={o.accent === "gold" ? "gold" : "primary"} className="mt-4">
                    <Zap className="w-4 h-4" /> {o.cta}
                  </CTA>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Daily reward pool"
        title={<>Win <span className="gradient-text">your share</span> from the daily prize pool</>}
        subtitle="Every 24 hours, connected stakers are randomly drawn to share the daily USDT prize pool. Stake any plan to enter automatically."
      >
        <StakingPool />
      </Section>

      <Section eyebrow="Lock periods" title={<>Choose your <span className="gradient-text">staking duration</span></>}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tiers.map((t) => (
            <div key={t.id} className={`relative rounded-2xl p-6 transition ${t.is_popular ? "glass-strong border-primary/40 glow-primary" : "glass"}`}>
              {(t.is_popular || t.badge) && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-[image:var(--gradient-gold)] text-gold-foreground">{t.badge || "Best APY"}</span>}
              <div className="flex items-center gap-2 text-primary"><Lock className="w-4 h-4" /><span className="text-xs uppercase tracking-widest">{t.name}</span></div>
              <p className="mt-4 text-4xl font-bold gradient-text">{t.apy_pct ?? "—"}%</p>
              <p className="text-xs text-muted-foreground mt-1">Estimated APY</p>
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Min stake</span><span className="font-medium">${Number(t.min_amount).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{t.flex || "Fixed"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reward</span><span className="font-medium">Daily</span></div>
              </div>
              <InvestButton service="staking" planName={t.name} minAmount={Number(t.min_amount)} variant={t.is_popular ? "gold" : "ghost"} className="w-full mt-6" />
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Interactive simulator"
        title={<>Watch your stake <span className="gradient-text">unlock & grow</span></>}
        subtitle="Pick a plan, set your amount and see a live countdown, locked-balance progress and daily reward preview update in real time."
      >
        <StakingTimeline />
      </Section>

      <Section>
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">Secure your <span className="gradient-text">crypto future</span></h2>
            <p className="mt-4 text-muted-foreground">Track locked balances, countdown timers and reward history in a premium portfolio dashboard built for serious stakers.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { l: "Total Staked", v: "$28,400" },
                { l: "Daily Reward", v: "$23.18" },
                { l: "Days Locked", v: "184 / 365" },
                { l: "Compound", v: "ON" },
              ].map((s) => (
                <div key={s.l} className="glass rounded-xl p-4">
                  <p className="text-xs text-muted-foreground">{s.l}</p>
                  <p className="text-lg font-semibold mt-1">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden border border-border/60 glow-gold">
            <img src={stakingImg} alt="Staking visualization" loading="lazy" className="w-full h-auto" />
          </div>
        </div>
      </Section>

      <ServiceReferral
        serviceName="Staking"
        accent="gold"
        bonus="Refer $10,000+ in locked stakes → +1% bonus APY for 30 days."
        tiers={[
          { level: "Direct (L1)", rate: "6%", note: "Of every stake your direct referral locks across any tier." },
          { level: "Network (L2)", rate: "2%", note: "Of stakes from your referrals' invited stakers." },
          { level: "Reward Share", rate: "0.5%", note: "Of daily staking rewards earned by your full network." },
        ]}
      />
    </>
  );
}
