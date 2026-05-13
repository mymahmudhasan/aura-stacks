import { createFileRoute } from "@tanstack/react-router";
import { Brain, Bot, LineChart, ShieldCheck, Sparkles, Activity } from "lucide-react";
import { CTA, GlassCard, PageHero, Section } from "@/components/ui-bits";
import aiImg from "@/assets/ai-trading.jpg";

export const Route = createFileRoute("/ai-trading")({
  component: AITrading,
  head: () => ({
    meta: [
      { title: "AI Trading — NovaVault" },
      { name: "description", content: "AI-powered trading for the next generation. Experience automated market analysis and intelligent crypto trading systems." },
    ],
  }),
});

function AITrading() {
  return (
    <>
      <PageHero
        eyebrow="AI Trading"
        title={<>AI-powered trading for the <span className="gradient-text">next generation</span></>}
        subtitle="Experience automated market analysis and intelligent crypto trading systems. NovaVault's AI scans hundreds of pairs and executes optimized strategies 24/7."
      />

      <Section>
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="relative">
            <div className="absolute -inset-10 bg-primary/20 blur-3xl -z-10 rounded-full" />
            <div className="rounded-3xl overflow-hidden border border-border/60 glow-primary">
              <img src={aiImg} alt="AI neural network" loading="lazy" className="w-full h-auto" />
            </div>
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
    </>
  );
}
