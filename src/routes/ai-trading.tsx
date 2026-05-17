import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Brain, Bot, LineChart, ShieldCheck, Sparkles, Activity, Zap } from "lucide-react";
import { CTA, GlassCard, PageHero, Section } from "@/components/ui-bits";
import { InvestButton } from "@/components/InvestButton";
import { ServiceReferral } from "@/components/ServiceReferral";
import { LiveForexChart } from "@/components/LiveForexChart";
import { PlansEmpty, PlansError, PlansLoading } from "@/components/PlansState";
import { listPlans } from "@/lib/plans.functions";
import aiImg from "@/assets/ai-trader-bot.webp";

export const Route = createFileRoute("/ai-trading")({
  component: AITrading,
  head: () => ({
    meta: [
      { title: "AI Trading — AuraTrad.Ai" },
      { name: "description", content: "AI-powered trading for the next generation. Experience automated market analysis and intelligent crypto trading systems." },
    ],
  }),
});

type DBPlan = {
  id: string; name: string;
  min_amount: number | string; max_amount: number | string | null;
  daily_rate_pct: number | string | null; duration_days: number | null;
  total_roi_pct: number | string | null; is_popular: boolean; badge: string | null;
};

function AITrading() {
  const [plans, setPlans] = useState<DBPlan[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errMsg, setErrMsg] = useState<string | undefined>();
  const load = useCallback(() => {
    setStatus("loading");
    setErrMsg(undefined);
    listPlans({ data: { service: "ai_trading" } })
      .then((d) => { setPlans(d as unknown as DBPlan[]); setStatus("ready"); })
      .catch((e: unknown) => { setErrMsg(e instanceof Error ? e.message : undefined); setStatus("error"); });
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <>
      <PageHero
        eyebrow="AI Trading"
        title={
          <>
            <span className="block text-shimmer text-2xl md:text-4xl lg:text-5xl font-extrabold uppercase tracking-[0.2em] mb-5">
              ◉ Live Market · Real-time
            </span>
            AI-powered trading for the <span className="gradient-text">next generation</span>
          </>
        }
        subtitle="Experience automated market analysis and intelligent crypto trading systems. AuraTrad.Ai's AI scans hundreds of pairs and executes optimized strategies 24/7."
      />

      <Section>
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="relative">
            <div className="absolute -inset-10 bg-[image:var(--gradient-aurora)] opacity-50 blur-3xl -z-10 rounded-full" />
            <div className="absolute -inset-6 bg-primary/25 blur-3xl -z-10 rounded-full" />
            <img src={aiImg} alt="AuraTrad.Ai AI trader bot avatar" loading="lazy" width={1024} height={1024} className="w-full h-auto drop-shadow-[0_30px_60px_rgba(56,189,248,0.4)]" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">Smart. Automated. <span className="gradient-text">Always on.</span></h2>
            <p className="mt-4 text-muted-foreground">Our trading engine combines neural-network market analysis with disciplined risk management — built for both beginners and pros.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { i: <Brain />, t: "Neural Analysis" },
                { i: <Bot />, t: "Auto Execution" },
                { i: <ShieldCheck />, t: "Risk Controls" },
                { i: <Activity />, t: "Live Stats" },
              ].map((f) => (
                <div key={f.t} className="glass rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">{f.i}</div>
                  <span className="text-sm font-medium">{f.t}</span>
                </div>
              ))}
            </div>
            <div className="mt-7 flex gap-3"><CTA to="/register">Activate AI Bot</CTA><CTA to="/faq" variant="ghost">Learn more</CTA></div>
          </div>
        </div>
      </Section>

      <Section
        eyebrow="Live market"
        title={<>Today's <span className="gradient-text">forex &amp; crypto</span> markets</>}
        subtitle="Real-time prices our AI bot is watching right now. Switch pairs to see what your AI trader is analyzing."
      >
        <LiveForexChart />
      </Section>

      <Section eyebrow="Bot performance" title={<>Live AI <span className="gradient-text">strategy stats</span></>} subtitle="Performance is reported transparently. Past results do not guarantee future returns.">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: "Quantum Arbitrage", win: "73%", trades: "2,418", monthly: "+11.2%" },
            { name: "Neural Momentum", win: "68%", trades: "1,902", monthly: "+8.7%" },
            { name: "DeepGrid Scalper", win: "81%", trades: "5,604", monthly: "+14.3%" },
          ].map((b) => (
            <GlassCard key={b.name}>
              <div className="flex items-center gap-2 text-primary mb-2"><Sparkles className="w-4 h-4" /><span className="text-xs uppercase tracking-widest">Strategy</span></div>
              <h3 className="text-lg font-semibold">{b.name}</h3>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div><p className="text-xs text-muted-foreground">Win Rate</p><p className="text-xl font-bold gradient-text">{b.win}</p></div>
                <div><p className="text-xs text-muted-foreground">Trades</p><p className="text-xl font-bold">{b.trades}</p></div>
                <div><p className="text-xs text-muted-foreground">Avg / mo</p><p className="text-xl font-bold text-success">{b.monthly}</p></div>
              </div>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="Plans" title={<>Activate your <span className="gradient-text">AI bot plan</span></>} subtitle="Pick a plan and let our AI trader work for you 24/7. Daily profits credited to your wallet.">
        {status === "loading" ? (
          <PlansLoading count={3} />
        ) : status === "error" ? (
          <PlansError onRetry={load} message={errMsg} />
        ) : plans.length === 0 ? (
          <PlansEmpty />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((p) => (
              <div key={p.id} className={`relative rounded-2xl p-6 transition ${p.is_popular ? "glass-strong border-primary/40 glow-primary" : "glass"}`}>
                {(p.is_popular || p.badge) && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-[image:var(--gradient-gold)] text-gold-foreground">{p.badge || "Most popular"}</span>}
                <div className="flex items-center gap-2 text-primary"><Bot className="w-4 h-4" /><span className="text-xs uppercase tracking-widest">{p.name}</span></div>
                <p className="mt-4 text-3xl font-bold gradient-text">{p.daily_rate_pct ?? "—"}%<span className="text-sm font-normal text-muted-foreground">/day</span></p>
                <div className="mt-5 space-y-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Investment</span><span className="font-medium">${Number(p.min_amount).toLocaleString()}{p.max_amount ? ` – $${Number(p.max_amount).toLocaleString()}` : ""}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{p.duration_days ? `${p.duration_days} days` : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total ROI</span><span className="font-medium">{p.total_roi_pct != null ? `${p.total_roi_pct}%` : "—"}</span></div>
                </div>
                <InvestButton service="ai_trading" planName={p.name} minAmount={Number(p.min_amount)} variant={p.is_popular ? "gold" : "ghost"} className="w-full mt-6" />
              </div>
            ))}
          </div>
        )}
      </Section>

      <ServiceReferral
        serviceName="AI Trading"
        accent="primary"
        bonus="Refer 3 active AI bot users → unlock a free Premium strategy slot."
        tiers={[
          { level: "Direct (L1)", rate: "12%", note: "Of every AI bot subscription and deposit from direct referrals." },
          { level: "Network (L2)", rate: "5%", note: "Of deposits from referrals brought in by your network." },
          { level: "Profit Share", rate: "2%", note: "Of net AI trading profits generated by your referred users." },
        ]}
      />
    </>
  );
}
