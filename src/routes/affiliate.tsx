import { createFileRoute } from "@tanstack/react-router";
import { Users, Gift, TrendingUp } from "lucide-react";
import { CTA, GlassCard, PageHero, Section } from "@/components/ui-bits";

export const Route = createFileRoute("/affiliate")({
  component: Affiliate,
  head: () => ({
    meta: [
      { title: "Affiliate Program — NovaVault" },
      { name: "description", content: "Earn lifetime crypto commissions across 3 referral tiers by inviting investors to NovaVault." },
    ],
  }),
});

function Affiliate() {
  const tiers = [
    { l: "Tier 1 — Direct", r: "10%", d: "Earn from every direct referral's investment." },
    { l: "Tier 2 — Network", r: "5%", d: "Commissions from your referrals' referrals." },
    { l: "Tier 3 — Extended", r: "2%", d: "Passive earnings from the third level of your network." },
  ];
  return (
    <>
      <PageHero
        eyebrow="Affiliate"
        title={<>Build your network. <span className="gradient-text">Earn for life.</span></>}
        subtitle="Share NovaVault with your community and earn lifetime crypto commissions across three referral tiers."
      />
      <Section>
        <div className="grid md:grid-cols-3 gap-5">
          {tiers.map((t) => (
            <GlassCard key={t.l}>
              <div className="flex items-center gap-2 text-primary mb-3"><Users className="w-4 h-4" /><span className="text-xs uppercase tracking-widest">Commission</span></div>
              <p className="text-4xl font-bold gradient-text">{t.r}</p>
              <p className="font-semibold mt-2">{t.l}</p>
              <p className="text-sm text-muted-foreground mt-1.5">{t.d}</p>
            </GlassCard>
          ))}
        </div>
      </Section>
      <Section eyebrow="Perks" title={<>More than <span className="gradient-text">commissions</span></>}>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { i: <Gift />, t: "VIP Bonuses", d: "Unlock bonuses and prize draws as your network grows." },
            { i: <TrendingUp />, t: "Live Leaderboard", d: "Compete monthly for the top affiliate spots." },
            { i: <Users />, t: "Marketing Kit", d: "Banners, videos and copy to share across your channels." },
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
    </>
  );
}
