import { createFileRoute } from "@tanstack/react-router";
import { Wallet, TrendingUp, Activity, Clock, ArrowDownLeft, ArrowUpRight, Cpu, Lock, Brain, Bell } from "lucide-react";
import { CTA, GlassCard, Section } from "@/components/ui-bits";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — NovaVault" }] }),
});

function Dashboard() {
  return (
    <Section className="!py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-2xl md:text-3xl font-bold">Investor <span className="gradient-text">#A2891</span></h1>
        </div>
        <div className="flex gap-2">
          <button className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2"><ArrowDownLeft className="w-4 h-4 text-success" /> Deposit</button>
          <button className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-gold" /> Withdraw</button>
          <button className="glass rounded-xl p-2"><Bell className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[image:var(--gradient-gold)] text-gold-foreground flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Withdrawals are sent manually to your Binance wallet.</p>
            <p className="text-xs text-muted-foreground mt-0.5">Make sure your Binance UID on file is correct. Payouts are processed within 24 hours.</p>
          </div>
        </div>
        <p className="text-xs font-mono text-primary">UID · 284910321</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<Wallet />} label="Total Balance" value="$48,920.30" trend="+12.4%" />
        <Stat icon={<TrendingUp />} label="Total Profit" value="$11,284.50" trend="+8.7%" />
        <Stat icon={<Activity />} label="Daily Earnings" value="$382.10" trend="Today" />
        <Stat icon={<Clock />} label="Pending Withdrawals" value="$240.00" trend="2 requests" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-5">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Active Investments</h3>
            <span className="text-xs text-muted-foreground">6 active</span>
          </div>
          <div className="space-y-3">
            {[
              { i: <Cpu className="text-primary" />, n: "Premium Mining", a: "$10,000", d: "+$200/day", p: 60 },
              { i: <Lock className="text-primary" />, n: "Staking 6M — ETH", a: "$5,000", d: "+$3.56/day", p: 32 },
              { i: <Brain className="text-primary" />, n: "AI Bot — DeepGrid", a: "$3,500", d: "+$13.40/day", p: 78 },
            ].map((row) => (
              <div key={row.n} className="rounded-xl glass p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">{row.i}</div>
                    <div>
                      <p className="font-medium text-sm">{row.n}</p>
                      <p className="text-xs text-muted-foreground">Invested {row.a}</p>
                    </div>
                  </div>
                  <p className="text-sm text-success font-medium">{row.d}</p>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-[image:var(--gradient-primary)]" style={{ width: `${row.p}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <ul className="space-y-3 text-sm">
            {[
              { t: "Mining reward distributed", a: "+$200.00", time: "2h ago", up: true },
              { t: "Withdrawal request", a: "−$120.00", time: "5h ago", up: false },
              { t: "AI Bot profit", a: "+$13.40", time: "8h ago", up: true },
              { t: "Staking reward", a: "+$3.56", time: "1d ago", up: true },
              { t: "Deposit confirmed", a: "+$5,000.00", time: "2d ago", up: true },
            ].map((e, i) => (
              <li key={i} className="flex items-center justify-between">
                <div>
                  <p>{e.t}</p>
                  <p className="text-xs text-muted-foreground">{e.time}</p>
                </div>
                <span className={e.up ? "text-success" : "text-gold"}>{e.a}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <div className="mt-8">
        <CTA to="/mining" variant="gold">Discover new plans</CTA>
      </div>
    </Section>
  );
}

function Stat({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">{icon}</div>
        <span className="text-xs text-success">{trend}</span>
      </div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </GlassCard>
  );
}
