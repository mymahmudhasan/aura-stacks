import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Wallet, TrendingUp, Activity, Clock, ArrowDownLeft, ArrowUpRight,
  Cpu, Lock, Brain, Bell, Users, Share2, Sparkles, Gift, Loader2, TrendingDown, RefreshCw, Settings, Check,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CTA, GlassCard, Section } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { RequirePhoneVerified } from "@/components/RequirePhoneVerified";
import { getMyWallet, getMyInvestments, getMyDeposits, getMyWithdrawals, updateBinanceUid } from "@/lib/wallet.functions";
import { QuickInvestForm } from "@/components/QuickInvestModal";
import { WelcomeBonusBanner } from "@/components/WelcomeBonusBanner";
import { OffersBanner } from "@/components/Offers";
import { listPlans } from "@/lib/plans.functions";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.session.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (role) throw redirect({ to: "/admin" });
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
  const [userId, setUserId] = useState<string>("");
  const [now, setNow] = useState<number>(() => Date.now());
  const [mounted, setMounted] = useState(false);
  const [planRates, setPlanRates] = useState<Record<string, number>>({});
  const [uidEditing, setUidEditing] = useState(false);
  const [uidInput, setUidInput] = useState("");
  const [uidSaving, setUidSaving] = useState(false);
  const [uidMsg, setUidMsg] = useState<string | null>(null);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [mounted]);
  useEffect(() => {
    listPlans({ data: {} })
      .then((rows) => {
        const map: Record<string, number> = {};
        for (const r of rows as Array<{ name: string; daily_rate_pct: number | string | null; apy_pct: number | string | null }>) {
          if (r.daily_rate_pct != null) map[r.name] = Number(r.daily_rate_pct) / 100;
          else if (r.apy_pct != null) map[r.name] = Number(r.apy_pct) / 100 / 365;
        }
        setPlanRates(map);
      })
      .catch(() => { /* ignore */ });
  }, []);
  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? "";
      setAccountId(uid.slice(0, 8).toUpperCase());
      setUserId(uid);
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
  const activeInvs = invs.filter((i) => i.status === "active");
  const investedActive = activeInvs.reduce((s, i) => s + Number(i.amount), 0);
  // Per-package daily ROI — sourced from active investment_plans rows so admin edits flow through.
  const dailyRateFor = (planName: string): number => planRates[planName] ?? 0.01;
  // Live profit accrual using each package's own daily ROI, ticking every second
  const computeAccrual = (i: Inv): number => {
    const start = i.started_at ? new Date(i.started_at).getTime() : new Date(i.created_at).getTime();
    const end = i.ends_at ? new Date(i.ends_at).getTime() : start + 30 * 86_400_000;
    const tNow = mounted ? now : start;
    const elapsedMs = Math.max(0, Math.min(tNow, end) - start);
    const elapsedDays = elapsedMs / 86_400_000;
    return Number(i.amount) * dailyRateFor(i.plan_name) * elapsedDays;
  };
  const liveAccrual = activeInvs.reduce((s, i) => s + computeAccrual(i), 0);
  const lifetimeEarnings = txns
    .filter((t) => t.kind === "earning")
    .reduce((s, t) => s + Number(t.amount), 0);
  // Portfolio Equity = cash balance + active invested principal + live accrued profit
  const portfolioEquity = balance + investedActive + liveAccrual;
  const earningsPlusInvested = lifetimeEarnings + liveAccrual + investedActive;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const earningsToday = txns
    .filter((t) => t.kind === "earning" && new Date(t.created_at) >= today)
    .reduce((s, t) => s + Number(t.amount), 0) + liveAccrual;
  // Featured (most recent) active package for the highlighted countdown card
  const featured = activeInvs
    .slice()
    .sort((a, b) => {
      const ta = a.started_at ? new Date(a.started_at).getTime() : new Date(a.created_at).getTime();
      const tb = b.started_at ? new Date(b.started_at).getTime() : new Date(b.created_at).getTime();
      return tb - ta;
    })[0];
  const pendingWdAmount = wds.filter((w) => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0);
  const pendingWdCount = wds.filter((w) => w.status === "pending").length;
  const pendingDepCount = deps.filter((d) => d.status === "pending").length;

  return (
    <Section className="!py-10">
      {userId && <WelcomeBonusBanner userId={userId} />}
      {demoType === "demo" && (
        <div className="mb-6 rounded-2xl border border-success/30 bg-success/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/20 text-success flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">You're on a free demo account</p>
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
          <Link to="/settings" className="glass rounded-xl p-2 hover:bg-primary/10 transition" title="Account Settings">
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {(() => {
        const hasDeposit = Number(cust?.total_deposited ?? 0) > 0 || deps.some((d) => d.status === "approved");
        const hasInvestment = activeInvs.length > 0;
        const steps = [
          { done: hasDeposit, label: "Make first deposit", to: "/deposit", icon: <ArrowDownLeft className="w-3.5 h-3.5" /> },
          { done: hasInvestment, label: "Choose an investment package", to: "#active-investments", icon: <Cpu className="w-3.5 h-3.5" /> },
        ];
        const completed = steps.filter((s) => s.done).length;
        if (completed === steps.length) return null;
        const pct = Math.round((completed / steps.length) * 100);
        return (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-card/40 backdrop-blur p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-semibold">2 steps to get started</p>
                <p className="text-xs text-muted-foreground mt-0.5">{completed} of {steps.length} complete</p>
              </div>
              <span className="text-xs font-bold text-primary">{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-4">
              <div className="h-full bg-[image:var(--gradient-primary)] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {steps.map((s) => {
                const isAnchor = s.to.startsWith("#");
                const className = `rounded-xl border px-3 py-2.5 flex items-center gap-2 text-xs transition ${
                  s.done
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-border bg-background/40 hover:bg-primary/10 hover:border-primary/30"
                }`;
                const inner = (
                  <>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      s.done ? "bg-success text-success-foreground" : "border border-border text-muted-foreground"
                    }`}>
                      {s.done ? <Check className="w-3 h-3" /> : s.icon}
                    </span>
                    <span className={`font-medium truncate ${s.done ? "line-through opacity-80" : ""}`}>{s.label}</span>
                  </>
                );
                if (isAnchor) {
                  return (
                    <a
                      key={s.label}
                      href={s.to}
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(s.to.slice(1));
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={className}
                    >
                      {inner}
                    </a>
                  );
                }
                return (
                  <Link key={s.label} to={s.to} className={className}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Featured active package — highlighted countdown right under user name/ID */}
      {featured && (() => {
        const start = featured.started_at ? new Date(featured.started_at).getTime() : new Date(featured.created_at).getTime();
        const end = featured.ends_at ? new Date(featured.ends_at).getTime() : start + 30 * 86_400_000;
        const total = Math.max(1, end - start);
        const pct = Math.max(0, Math.min(100, Math.round(((now - start) / total) * 100)));
        const remaining = Math.max(0, end - now);
        const d = Math.floor(remaining / 86_400_000);
        const h = Math.floor((remaining % 86_400_000) / 3_600_000);
        const m = Math.floor((remaining % 3_600_000) / 60_000);
        const s = Math.floor((remaining % 60_000) / 1000);
        const matured = remaining === 0;
        const accrued = computeAccrual(featured);
        const dailyPct = dailyRateFor(featured.plan_name) * 100;
        return (
          <div className="mb-6 rounded-2xl p-[1.5px] bg-[image:var(--gradient-aurora)] glow-primary animate-fade-in">
            <div className="rounded-2xl bg-background/85 backdrop-blur-xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] shrink-0">
                    {serviceIcon[featured.service] ?? <Sparkles className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[image:var(--gradient-gold)] text-gold-foreground font-bold">Active Package</span>
                      {matured && <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-success/20 text-success font-bold">Matured</span>}
                    </div>
                    <p className="font-extrabold text-base sm:text-lg mt-0.5 truncate">{featured.plan_name}</p>
                    <div className="text-xs mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="capitalize"><span className="text-muted-foreground">Plan:</span> <span className="text-foreground font-semibold">{featured.service.replace("_", " ")}</span></span>
                      <span className="text-muted-foreground">•</span>
                      <span><span className="text-muted-foreground">Invested:</span> <span className="text-foreground font-semibold">${Number(featured.amount).toLocaleString()}</span></span>
                      <span className="text-muted-foreground">•</span>
                      <span><span className="text-muted-foreground">Daily profit:</span> <span className="text-success font-semibold">{dailyPct.toFixed(3)}%</span></span>
                      <span className="text-muted-foreground">•</span>
                      <span><span className="text-muted-foreground">Duration:</span> <span className="text-foreground font-semibold">{Math.max(1, Math.round((end - start) / 86_400_000))} days</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {!matured ? (
                    <div className="flex items-center gap-1.5 font-mono text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="px-2 py-1 rounded bg-primary/15 text-primary font-bold">{String(d).padStart(2, "0")}d</span>
                      <span className="px-2 py-1 rounded bg-primary/15 text-primary font-bold">{String(h).padStart(2, "0")}h</span>
                      <span className="px-2 py-1 rounded bg-primary/15 text-primary font-bold">{String(m).padStart(2, "0")}m</span>
                      <span className="px-2 py-1 rounded bg-primary/15 text-primary font-bold">{String(s).padStart(2, "0")}s</span>
                    </div>
                  ) : (
                    <span className="text-sm font-mono text-success font-bold">Ready to claim</span>
                  )}
                  <span className="text-xs font-mono text-success font-bold">+${accrued.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })} earned</span>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-[image:var(--gradient-primary)] transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              {activeInvs.length > 1 && (
                <p className="text-[11px] text-muted-foreground mt-2">+{activeInvs.length - 1} more active package{activeInvs.length - 1 === 1 ? "" : "s"} below</p>
              )}
            </div>
          </div>
        );
      })()}

      <div className={`mb-6 rounded-2xl border p-4 flex flex-col gap-3 ${cust?.binance_uid ? "border-primary/30 bg-primary/5" : "border-destructive/40 bg-destructive/5"}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cust?.binance_uid ? "bg-[image:var(--gradient-gold)] text-gold-foreground" : "bg-destructive/20 text-destructive"}`}>
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {cust?.binance_uid
                  ? "Withdrawals are sent manually to your Binance wallet."
                  : "Set your Binance UID to enable withdrawals."}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cust?.binance_uid
                  ? "Payouts are processed within 24 hours. Tap your UID to update it."
                  : "Without a UID on file we can't send your payouts. Add it here in seconds."}
              </p>
            </div>
          </div>
          {!uidEditing ? (
            <button
              type="button"
              onClick={() => { setUidInput(cust?.binance_uid ?? ""); setUidMsg(null); setUidEditing(true); }}
              className="text-xs font-mono px-3 py-1.5 rounded-lg glass hover:bg-primary/10 transition inline-flex items-center gap-2"
            >
              <span className="text-primary">UID · {cust?.binance_uid ?? "not set"}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{cust?.binance_uid ? "Edit" : "Add"}</span>
            </button>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setUidSaving(true); setUidMsg(null);
                try {
                  await updateBinanceUid({ data: { binance_uid: uidInput.trim() } });
                  setUidEditing(false);
                  await load(false);
                } catch (err) {
                  setUidMsg(err instanceof Error ? err.message : "Failed to save UID");
                } finally { setUidSaving(false); }
              }}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <input
                autoFocus
                value={uidInput}
                onChange={(e) => setUidInput(e.target.value)}
                placeholder="284910321"
                className="rounded-lg glass px-3 py-1.5 text-xs font-mono w-40 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button type="submit" disabled={uidSaving || uidInput.trim().length < 3} className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground glow-primary disabled:opacity-60 inline-flex items-center gap-1">
                {uidSaving && <Loader2 className="w-3 h-3 animate-spin" />} Save
              </button>
              <button type="button" onClick={() => { setUidEditing(false); setUidMsg(null); }} className="text-xs text-muted-foreground hover:text-foreground px-2">Cancel</button>
            </form>
          )}
        </div>
        {uidMsg && <p className="text-xs text-destructive">{uidMsg}</p>}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat icon={<Wallet />} label="Total Balance" value={`$${balance.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`} trend={demoType === "demo" ? "Demo" : "Live"} highlight />
        <Stat icon={<TrendingUp />} label="Portfolio Equity" value={`$${portfolioEquity.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`} trend="Live" positive highlight />
        <Stat icon={<Activity />} label="Earnings Today" value={`$${earningsToday.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`} trend="Today" positive />
        <Stat icon={<Sparkles />} label="Earnings + Invested" value={`$${earningsPlusInvested.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`} trend="Lifetime" positive />
        <Stat icon={<Clock />} label="Pending Withdrawals" value={`$${pendingWdAmount.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`} trend={`${pendingWdCount} request${pendingWdCount === 1 ? "" : "s"}`} />
      </div>

      <div id="active-investments" className="grid lg:grid-cols-3 gap-5 mt-5 scroll-mt-24">
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
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[image:var(--gradient-gold)] text-gold-foreground font-bold shadow inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Quick Invest
              </span>
            </div>

            {/* Inline Quick Invest — all features embedded */}
            <div className="mb-5 rounded-xl border border-primary/30 bg-background/60 p-4">
              <QuickInvestForm />
            </div>

            {activeInvs.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No active investments yet — pick a package above to start earning.</p>
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
