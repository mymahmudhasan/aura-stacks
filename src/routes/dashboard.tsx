import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Wallet, TrendingUp, Activity, Clock, ArrowDownLeft, ArrowUpRight,
  Cpu, Lock, Brain, Bell, Users, Share2, Sparkles, Gift, Loader2, TrendingDown, RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CTA, GlassCard, Section } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { RequirePhoneVerified } from "@/components/RequirePhoneVerified";
import { getMyWallet, getMyInvestments, getMyDeposits, getMyWithdrawals } from "@/lib/wallet.functions";
import { QuickInvestModal } from "@/components/QuickInvestModal";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: () => (
    <RequirePhoneVerified>
      <Dashboard />
    </RequirePhoneVerified>
  ),
  head: () => ({ meta: [{ title: "Dashboard — AuraTrad.Ai" }] }),
});

type Customer = {
  full_name: string | null;
  balance: number;
  total_deposited: number;
  total_withdrawn: number;
  account_type: string;
  demo_balance: number;
  binance_uid: string | null;
};
type Txn = { id: string; kind: string; amount: number; currency: string; status: string; notes: string | null; created_at: string };
type Inv = { id: string; service: string; plan_name: string; amount: number; status: string; started_at: string | null; ends_at: string | null; created_at: string };
type Dep = { id: string; amount: number; status: string };
type Wd = { id: string; amount: number; status: string };

const serviceIcon: Record<string, React.ReactNode> = {
  ai_trading: <Brain className="w-4 h-4 text-primary" />,
  mining: <Cpu className="w-4 h-4 text-primary" />,
  staking: <Lock className="w-4 h-4 text-primary" />,
};

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cust, setCust] = useState<Customer | null>(null);
  const [demoType, setDemoType] = useState<string>("demo");
  const [txns, setTxns] = useState<Txn[]>([]);
  const [invs, setInvs] = useState<Inv[]>([]);
  const [deps, setDeps] = useState<Dep[]>([]);
  const [wds, setWds] = useState<Wd[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [quickOpen, setQuickOpen] = useState(false);

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? "";
      setAccountId(uid.slice(0, 8).toUpperCase());
      const [w, i, d, wlist, custExtra] = await Promise.all([
        getMyWallet(),
        getMyInvestments(),
        getMyDeposits(),
        getMyWithdrawals(),
        uid
          ? supabase.from("customers").select("account_type,demo_balance").eq("user_id", uid).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      const c = w.customer as Partial<Customer> | null;
      setCust({
        full_name: c?.full_name ?? null,
        balance: Number(c?.balance ?? 0),
        total_deposited: Number(c?.total_deposited ?? 0),
        total_withdrawn: Number(c?.total_withdrawn ?? 0),
        account_type: custExtra.data?.account_type ?? "demo",
        demo_balance: Number(custExtra.data?.demo_balance ?? 0),
        binance_uid: (c as { binance_uid?: string | null } | null)?.binance_uid ?? null,
      });
      setDemoType(custExtra.data?.account_type ?? "demo");
      setTxns(w.transactions as Txn[]);
      setInvs(i as Inv[]);
      setDeps(d as Dep[]);
      setWds(wlist as Wd[]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    const t = setInterval(() => load(false), 30_000);
    const onFocus = () => load(false);
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const balance = cust?.balance ?? 0;
  const totalProfit = balance + (cust?.total_withdrawn ?? 0) - (cust?.total_deposited ?? 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const earningsToday = txns
    .filter((t) => t.kind === "earning" && new Date(t.created_at) >= today)
    .reduce((s, t) => s + Number(t.amount), 0);
  const pendingWdAmount = wds.filter((w) => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0);
  const pendingWdCount = wds.filter((w) => w.status === "pending").length;
  const pendingDepCount = deps.filter((d) => d.status === "pending").length;
  const activeInvs = invs.filter((i) => i.status === "active");

  return (
    <Section className="!py-10">
      {demoType === "demo" && (
        <div className="mb-6 rounded-2xl border border-success/30 bg-success/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/20 text-success flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">You're on a free demo account · ${Number(cust?.demo_balance ?? 0).toLocaleString()} virtual balance</p>
              <p className="text-xs text-muted-foreground mt-0.5">Make your first deposit to unlock real trading, mining and staking — your account upgrades automatically.</p>
            </div>
          </div>
          <Link to="/deposit" className="rounded-xl px-4 py-2 text-sm bg-primary text-primary-foreground glow-primary inline-flex items-center gap-2 shrink-0">
            <ArrowDownLeft className="w-4 h-4" /> Deposit & go live
          </Link>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-gold/40 bg-gold/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden">
        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[image:var(--gradient-gold)] text-gold-foreground flex items-center justify-center shrink-0 shadow-[var(--shadow-gold)]">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold"><span className="gradient-text">25% Deposit Bonus</span> — Limited time offer</p>
            <p className="text-xs text-muted-foreground mt-0.5">Top up your account now and receive an extra 25% credited after admin approval.</p>
          </div>
        </div>
        <Link to="/deposit" className="relative shrink-0 rounded-xl px-4 py-2 text-sm font-semibold bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold inline-flex items-center gap-2 hover:opacity-90 transition">
          <ArrowDownLeft className="w-4 h-4" /> Deposit & Claim 25%
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-2xl md:text-3xl font-bold">
            {cust?.full_name ?? "Investor"} <span className="gradient-text">#{accountId || "—"}</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/deposit" className="rounded-xl px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold hover:opacity-90 transition">
            <ArrowDownLeft className="w-4 h-4" /> Deposit
          </Link>
          <Link to="/withdraw" className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2 hover:bg-primary/10 transition">
            <ArrowUpRight className="w-4 h-4 text-gold" /> Withdraw
          </Link>
          <Link to="/transactions" className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2 hover:bg-primary/10 transition">
            <Activity className="w-4 h-4 text-primary" /> Transactions
          </Link>
          <Link to="/wallet" className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2 hover:bg-primary/10 transition">
            <Wallet className="w-4 h-4" /> Wallet
          </Link>
          <Link to="/referrals" className="rounded-xl px-4 py-2 text-sm flex items-center gap-2 bg-primary text-primary-foreground glow-primary">
            <Share2 className="w-4 h-4" /> Referrals
          </Link>
          <button onClick={() => load(false)} disabled={refreshing} className="glass rounded-xl p-2 hover:bg-primary/10 transition" title="Refresh">
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
          <button className="glass rounded-xl p-2 relative" title="Notifications">
            <Bell className="w-4 h-4" />
            {(pendingDepCount + pendingWdCount) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-gold-foreground text-[10px] font-bold flex items-center justify-center">
                {pendingDepCount + pendingWdCount}
              </span>
            )}
          </button>
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
        <p className="text-xs font-mono text-primary">UID · {cust?.binance_uid ?? "not set"}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<Wallet />} label="Total Balance" value={`$${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} trend={demoType === "demo" ? "Demo" : "Live"} highlight />
        <Stat icon={totalProfit >= 0 ? <TrendingUp /> : <TrendingDown />} label="Total Profit" value={`${totalProfit >= 0 ? "+" : "-"}$${Math.abs(totalProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} trend={totalProfit >= 0 ? "All time" : "All time"} positive={totalProfit >= 0} highlight />
        <Stat icon={<Activity />} label="Earnings Today" value={`$${earningsToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} trend="Today" positive />
        <Stat icon={<Clock />} label="Pending Withdrawals" value={`$${pendingWdAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} trend={`${pendingWdCount} request${pendingWdCount === 1 ? "" : "s"}`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-5">
        <div className="lg:col-span-2 relative rounded-2xl p-[1.5px] bg-[image:var(--gradient-aurora)] glow-primary animate-fade-in">
          <div className="absolute -inset-8 bg-[image:var(--gradient-aurora)] opacity-30 blur-3xl -z-10 rounded-full pointer-events-none" />
          <div className="rounded-2xl bg-background/80 backdrop-blur-xl p-5">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] animate-pulse">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">Active Investments</h3>
                  <p className="text-xs text-muted-foreground">{activeInvs.length} running · live updates</p>
                </div>
              </div>
              <button onClick={() => setQuickOpen(true)} className="rounded-xl px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 bg-[image:var(--gradient-primary)] text-primary-foreground glow-primary hover:opacity-90 transition hover-scale">
                <Sparkles className="w-4 h-4" /> Quick Invest
              </button>
            </div>

            {/* Featured AI Trading invest card — always shown, top priority */}
            <button onClick={() => setQuickOpen(true)} className="group relative block w-full text-left rounded-xl overflow-hidden border border-primary/40 bg-[image:var(--gradient-aurora)]/20 p-4 mb-4 hover:border-primary transition">
              <div className="absolute inset-0 bg-[image:var(--gradient-primary)] opacity-10 group-hover:opacity-20 transition" />
              <div className="relative flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] animate-pulse">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base">AI Trading Bot</p>
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-gold/20 text-gold font-bold">Top Pick</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Up to <span className="text-success font-semibold">+14.3% / mo</span> · Neural strategies, 24/7</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary inline-flex items-center gap-1 group-hover:translate-x-1 transition">
                  Invest now <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
            </button>

            {activeInvs.length === 0 ? (
              <div className="text-center py-6 rounded-xl glass">
                <p className="text-sm text-muted-foreground">No active investments yet — pick a plan below.</p>
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  <Link to="/mining" className="text-xs px-3 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition">Mining</Link>
                  <Link to="/staking" className="text-xs px-3 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition">Staking</Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeInvs.map((row) => {
                  const start = row.started_at ? new Date(row.started_at).getTime() : new Date(row.created_at).getTime();
                  const end = row.ends_at ? new Date(row.ends_at).getTime() : start + 30 * 24 * 3600 * 1000;
                  const pct = Math.max(0, Math.min(100, Math.round(((Date.now() - start) / (end - start)) * 100)));
                  const isAI = row.service === "ai_trading";
                  return (
                    <div key={row.id} className={`relative rounded-xl p-4 transition hover-scale ${isAI ? "border border-primary/40 bg-primary/5 glow-primary" : "glass"}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAI ? "bg-[image:var(--gradient-primary)] text-primary-foreground" : "bg-primary/15"}`}>
                            {serviceIcon[row.service] ?? <TrendingUp className="w-4 h-4 text-primary" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{row.plan_name}</p>
                              {isAI && <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-gold/20 text-gold font-bold">AI</span>}
                            </div>
                            <p className="text-xs text-muted-foreground capitalize">{row.service.replace("_", " ")} · Invested ${Number(row.amount).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-mono ${isAI ? "text-primary font-bold" : "text-muted-foreground"}`}>{pct}%</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-[image:var(--gradient-primary)] transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Activity</h3>
            <Link to="/wallet" className="text-xs text-primary">View all →</Link>
          </div>
          {txns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No activity yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {txns.slice(0, 6).map((e) => {
                const amt = Number(e.amount);
                return (
                  <li key={e.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="capitalize truncate">{e.notes ?? e.kind.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`shrink-0 font-medium ${amt >= 0 ? "text-success" : "text-gold"}`}>
                      {amt >= 0 ? "+" : ""}{amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </div>

      <Link to="/referrals" className="mt-8 block rounded-2xl glass-strong p-5 hover:border-primary/40 transition group">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[image:var(--gradient-gold)] text-gold-foreground flex items-center justify-center"><Users className="w-5 h-5" /></div>
            <div>
              <p className="font-semibold">Referral Dashboard</p>
              <p className="text-xs text-muted-foreground">Track your direct & network referrals and live commissions.</p>
            </div>
          </div>
          <span className="text-sm text-primary group-hover:translate-x-1 transition">Open →</span>
        </div>
      </Link>

      <div className="mt-8">
        <CTA to="/mining" variant="gold">Discover new plans</CTA>
      </div>
    </Section>
  );
}

function Stat({ icon, label, value, trend, highlight = false, positive }: { icon: React.ReactNode; label: string; value: string; trend: string; highlight?: boolean; positive?: boolean }) {
  return (
    <GlassCard glow={highlight}>
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${highlight ? "bg-[image:var(--gradient-gold)] text-gold-foreground" : "bg-primary/15 text-primary"}`}>{icon}</div>
        <span className={`text-xs font-semibold ${positive === false ? "text-destructive" : positive === true ? "text-success" : "text-muted-foreground"}`}>{trend}</span>
      </div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4">{label}</p>
      <p className={`font-extrabold mt-1 ${highlight ? "text-3xl md:text-4xl gradient-text" : "text-2xl"}`}>{value}</p>
    </GlassCard>
  );
}
