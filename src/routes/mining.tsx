import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Cpu, Check, Zap } from "lucide-react";
import { CTA, GlassCard, PageHero, Section } from "@/components/ui-bits";
import { InvestButton } from "@/components/InvestButton";
import { ServiceReferral } from "@/components/ServiceReferral";
import { PlansEmpty, PlansError, PlansLoading } from "@/components/PlansState";
import { listPlans } from "@/lib/plans.functions";
import miningImg from "@/assets/mining-visual.webp";

export const Route = createFileRoute("/mining")({
  component: Mining,
  head: () => ({
    meta: [
      { title: "Mining Plans — AuraTrad.Ai" },
      { name: "description", content: "Power your crypto future with smart mining. Choose from Starter to VIP mining plans and earn daily crypto rewards." },
    ],
  }),
});

type DBPlan = {
  id: string; name: string;
  min_amount: number | string; max_amount: number | string | null;
  daily_rate_pct: number | string | null; duration_days: number | null;
  total_roi_pct: number | string | null; is_popular: boolean; badge: string | null;
};

const money = (v: number | string | null) => v == null ? "—" : `$${Number(v).toLocaleString()}`;

function Mining() {
  const [plans, setPlans] = useState<DBPlan[]>([]);
  useEffect(() => {
    listPlans({ data: { service: "mining" } }).then((d) => setPlans(d as unknown as DBPlan[])).catch(() => {});
  }, []);
  return (
    <>
      <PageHero
        eyebrow="Mining"
        title={<>Power your crypto future with <span className="gradient-text">smart mining</span></>}
        subtitle="Start earning daily crypto rewards through advanced mining investment solutions, distributed automatically every 24 hours."
      />

      <Section>
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="rounded-3xl overflow-hidden border border-border/60 glow-primary">
            <img src={miningImg} alt="Mining infrastructure" loading="lazy" className="w-full h-auto" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">Industrial-grade <span className="gradient-text">infrastructure</span></h2>
            <p className="mt-4 text-muted-foreground">AuraTrad.Ai operates next-generation mining facilities optimized for performance, cooling and renewable energy. Your investment powers real hashrate.</p>
            <ul className="mt-6 space-y-3">
              {["Live profit counter & daily auto-distribution", "Mining history logs and full transparency", "Active investment tracking dashboard", "Automatic ROI estimation per plan"].map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm"><Check className="w-4 h-4 text-primary mt-0.5" />{p}</li>
              ))}
            </ul>
            <div className="mt-8 flex gap-3"><CTA to="/register">Start mining</CTA><CTA to="/faq" variant="ghost">How it works</CTA></div>
          </div>
        </div>
      </Section>

      <Section
        eyebrow="Plans"
        title={<>Choose your <span className="gradient-text">mining package</span></>}
        subtitle="Transparent pricing. Daily rewards. Cancel anytime after the lock period."
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((p) => (
            <div key={p.id} className={`relative rounded-2xl p-6 transition ${p.is_popular ? "glass-strong border-primary/40 glow-primary" : "glass"}`}>
              {(p.is_popular || p.badge) && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-[image:var(--gradient-gold)] text-gold-foreground">{p.badge || "Most popular"}</span>}
              <div className="flex items-center gap-2 text-primary"><Cpu className="w-4 h-4" /><span className="text-xs uppercase tracking-widest">{p.name}</span></div>
              <p className="mt-4 text-3xl font-bold gradient-text">{p.daily_rate_pct ?? "—"}%<span className="text-sm font-normal text-muted-foreground">/day</span></p>
              <div className="mt-5 space-y-2.5 text-sm">
                <Row label="Investment" value={`${money(p.min_amount)}${p.max_amount ? ` – ${money(p.max_amount)}` : ""}`} />
                <Row label="Duration" value={p.duration_days ? `${p.duration_days} days` : "—"} />
                <Row label="Total ROI" value={p.total_roi_pct != null ? `${p.total_roi_pct}%` : "—"} />
                <Row label="Distribution" value="Daily (UTC-5)" />
              </div>
              <InvestButton service="mining" planName={p.name} minAmount={Number(p.min_amount)} variant={p.is_popular ? "gold" : "ghost"} className="w-full mt-6" />
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Calculator" title={<>Estimate your <span className="gradient-text">earnings</span></>}>
        <GlassCard>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Investment</p>
              <p className="text-3xl font-bold mt-2">$10,000</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Daily reward</p>
              <p className="text-3xl font-bold mt-2 gradient-text">$200</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">After 60 days</p>
              <p className="text-3xl font-bold mt-2 text-success">$22,000</p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><Zap className="w-4 h-4 text-primary" />Estimates based on Premium plan at 2.0% daily. Actual returns may vary.</div>
        </GlassCard>
      </Section>

      <ServiceReferral
        serviceName="Mining"
        accent="primary"
        bonus="Refer 5 active miners → unlock a $250 hashrate bonus."
        tiers={[
          { level: "Direct (L1)", rate: "8%", note: "On every deposit your referral makes into any mining plan." },
          { level: "Network (L2)", rate: "3%", note: "On deposits made by your referrals' referrals." },
          { level: "Daily Rewards", rate: "1%", note: "Of the daily mining payouts your network earns — for life." },
        ]}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
