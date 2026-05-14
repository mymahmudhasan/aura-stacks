import { createFileRoute } from "@tanstack/react-router";
import { Lock, TrendingUp, Timer, Layers } from "lucide-react";
import { CTA, GlassCard, PageHero, Section } from "@/components/ui-bits";
import { ServiceReferral } from "@/components/ServiceReferral";
import stakingImg from "@/assets/staking-visual.jpg";

export const Route = createFileRoute("/staking")({
  component: Staking,
  head: () => ({
    meta: [
      { title: "Staking Plans — NovaVault" },
      { name: "description", content: "Lock, stake and earn daily rewards. Choose from 1, 3, 6 or 12-month staking with up to 38% APY on top crypto assets." },
    ],
  }),
});

const tiers = [
  { d: "1 Month", apy: "12%", min: "$50", flex: "Flexible" },
  { d: "3 Months", apy: "18%", min: "$250", flex: "Fixed" },
  { d: "6 Months", apy: "26%", min: "$1,000", flex: "Fixed" },
  { d: "12 Months", apy: "38%", min: "$2,500", flex: "Fixed", best: true },
];

function Staking() {
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

      <Section eyebrow="Lock periods" title={<>Choose your <span className="gradient-text">staking duration</span></>}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tiers.map((t) => (
            <div key={t.d} className={`relative rounded-2xl p-6 transition ${t.best ? "glass-strong border-primary/40 glow-primary" : "glass"}`}>
              {t.best && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-[image:var(--gradient-gold)] text-gold-foreground">Best APY</span>}
              <div className="flex items-center gap-2 text-primary"><Lock className="w-4 h-4" /><span className="text-xs uppercase tracking-widest">{t.d}</span></div>
              <p className="mt-4 text-4xl font-bold gradient-text">{t.apy}</p>
              <p className="text-xs text-muted-foreground mt-1">Estimated APY</p>
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Min stake</span><span className="font-medium">{t.min}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{t.flex}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reward</span><span className="font-medium">Daily</span></div>
              </div>
              <CTA to="/register" variant={t.best ? "gold" : "ghost"} className="w-full mt-6">Stake now</CTA>
            </div>
          ))}
        </div>
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
