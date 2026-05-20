import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Wallet, TrendingUp, Activity, Clock, ArrowDownLeft, ArrowUpRight,
  Cpu, Lock, Brain, Bell, Users, Share2, Sparkles, Gift, Loader2, RefreshCw, Settings, Check,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CTA, GlassCard, Section } from "@/components/ui-bits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { RequirePhoneVerified } from "@/components/RequirePhoneVerified";
import { getMyWallet, getMyInvestments, getMyDeposits, getMyWithdrawals, updateBinanceUid } from "@/lib/wallet.functions";
import { QuickInvestForm } from "@/components/QuickInvestModal";
import { WelcomeBonusBanner } from "@/components/WelcomeBonusBanner";
import { OffersBanner, useOffersData } from "@/components/Offers";
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

const fmtUsd = (n: number, frac = 2) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: frac, maximumFractionDigits: frac })}`;

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
  const [notifOpen, setNotifOpen] = useState(false);
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
  const dailyRateFor = (planName: string): number => planRates[planName] ?? 0.01;
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
  const portfolioEquity = balance + investedActive + liveAccrual;
  const earningsPlusInvested = lifetimeEarnings + liveAccrual + investedActive;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const earningsToday = txns
    .filter((t) => t.kind === "earning" && new Date(t.created_at) >= today)
    .reduce((s, t) => s + Number(t.amount), 0) + liveAccrual;
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

  const initials = (cust?.full_name ?? "Investor")
    .split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("") || "IN";
  const isDemo = demoType === "demo";

  const hasDeposit = Number(cust?.total_deposited ?? 0) > 0 || deps.some((d) => d.status === "approved");
  const hasInvestment = activeInvs.length > 0;
  const onboardSteps = [
    { done: hasDeposit, label: "Make first deposit", to: "/deposit", icon: <ArrowDownLeft className="w-3.5 h-3.5" /> },
    { done: hasInvestment, label: "Choose an investment", to: "#investments-tab", icon: <Cpu className="w-3.5 h-3.5" /> },
  ];
  const onboardDone = onboardSteps.every((s) => s.done);

  return (
    <Section className="!py-10">
      {/* ── HERO ────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl p-[1.5px] bg-[image:var(--gradient-aurora)] glow-primary animate-fade-in mb-6">
        <div className="rounded-3xl bg-background/85 backdrop-blur-xl p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground flex items-center justify-center text-lg font-extrabold shadow-[var(--shadow-glow)] shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Welcome back</p>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
                  {cust?.full_name ?? "Investor"}
                </h1>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full glass text-primary">
                    #{accountId || "—"}
                  </span>
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold ${
                    isDemo ? "bg-success/15 text-success border border-success/30" : "bg-primary/15 text-primary border border-primary/30"
                  }`}>
                    {isDemo ? "Demo" : "Live"}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[image:var(--gradient-gold)] text-gold-foreground font-bold inline-flex items-center gap-1">
                    <Gift className="w-3 h-3" /> 25% Bonus
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => load(false)} disabled={refreshing} className="glass rounded-xl p-2 hover:bg-primary/10 transition" title="Refresh">
                {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="glass rounded-xl p-2 relative hover:bg-primary/10 transition"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {(pendingDepCount + pendingWdCount) > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gold text-gold-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {pendingDepCount + pendingWdCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] glass-strong rounded-2xl border border-primary/30 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
                        <p className="text-sm font-semibold">Notifications</p>
                        <span className="text-[10px] text-muted-foreground">
                          {pendingDepCount + pendingWdCount} pending
                        </span>
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-border">
                        {pendingDepCount === 0 && pendingWdCount === 0 && txns.slice(0, 5).length === 0 ? (
                          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                            <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
                            You're all caught up.
                          </div>
                        ) : (
                          <>
                            {pendingDepCount > 0 && (
                              <Link
                                to="/deposit"
                                onClick={() => setNotifOpen(false)}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-primary/5 transition"
                              >
                                <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0">
                                  <ArrowDownLeft className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold">Deposit awaiting review</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {pendingDepCount} deposit{pendingDepCount > 1 ? "s" : ""} pending admin approval.
                                  </p>
                                </div>
                              </Link>
                            )}
                            {pendingWdCount > 0 && (
                              <Link
                                to="/withdraw"
                                onClick={() => setNotifOpen(false)}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-primary/5 transition"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                                  <ArrowUpRight className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold">Withdrawal in progress</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {pendingWdCount} request · {fmtUsd(pendingWdAmount)}
                                  </p>
                                </div>
                              </Link>
                            )}
                            {txns.slice(0, 5).map((t) => (
                              <div key={t.id} className="flex items-start gap-3 px-4 py-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  Number(t.amount) >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                                }`}>
                                  {Number(t.amount) >= 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold capitalize">
                                    {t.kind} · <span className="tabular-nums">{fmtUsd(Math.abs(Number(t.amount)))}</span>
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {t.notes ?? t.status}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {new Date(t.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                      <Link
                        to="/transactions"
                        onClick={() => setNotifOpen(false)}
                        className="block text-center text-xs font-semibold py-2.5 border-t border-border bg-primary/5 hover:bg-primary/10 text-primary transition"
                      >
                        View all activity →
                      </Link>
                    </div>
                  </>
                )}
              </div>
              <Link to="/settings" className="glass rounded-xl p-2 hover:bg-primary/10 transition" title="Settings">
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Portfolio Equity headline */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Portfolio Equity · Live
              </div>
              <p className="font-extrabold gradient-text text-4xl sm:text-5xl mt-1 leading-none tabular-nums">
                {fmtUsd(portfolioEquity, 6)}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30 shadow-[0_0_20px_-4px_hsl(var(--success)/0.5)] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                <span className="text-sm font-extrabold text-success tabular-nums tracking-tight">
                  +{fmtUsd(earningsToday, 6)} today
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/deposit" className="rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold hover:opacity-90 transition">
                <ArrowDownLeft className="w-4 h-4" /> Deposit
              </Link>
              <Link to="/withdraw" className="rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 glass hover:bg-primary/10 transition">
                <ArrowUpRight className="w-4 h-4 text-gold" /> Withdraw
              </Link>
              <Link to="/referrals" className="rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 bg-primary text-primary-foreground glow-primary">
                <Share2 className="w-4 h-4" /> Refer
              </Link>
            </div>
          </div>

          {/* Mini KPIs */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniKpi icon={<Wallet className="w-3.5 h-3.5" />} label="Balance" value={fmtUsd(balance)} />
            <MiniKpi icon={<TrendingUp className="w-3.5 h-3.5" />} label="Invested" value={fmtUsd(investedActive)} positive />
            <MiniKpi icon={<Activity className="w-3.5 h-3.5" />} label="Lifetime" value={fmtUsd(earningsPlusInvested)} positive />
            <MiniKpi icon={<Clock className="w-3.5 h-3.5" />} label="Pending withdrawals" value={fmtUsd(pendingWdAmount)} sub={`${pendingWdCount} req`} />
          </div>
        </div>
      </div>

      {userId && <div className="mb-4"><WelcomeBonusBanner userId={userId} /></div>}

      {/* Demo strip */}
      {isDemo && (
        <div className="mb-4 rounded-2xl border border-success/30 bg-success/5 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles className="w-4 h-4 text-success shrink-0" />
            <p className="text-sm">
              <span className="font-semibold">You're on a free demo.</span>{" "}
              <span className="text-muted-foreground">Deposit to unlock real trading, mining and staking.</span>
            </p>
          </div>
          <Link to="/deposit" className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-success text-success-foreground inline-flex items-center gap-1.5 shrink-0">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Go live
          </Link>
        </div>
      )}

      {/* Onboarding pill */}
      {!onboardDone && (
        <div className="mb-4 rounded-2xl border border-primary/20 bg-card/40 backdrop-blur px-4 py-3 flex items-center gap-3 flex-wrap">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground shrink-0">Get started</p>
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {onboardSteps.map((s) => {
              const isAnchor = s.to.startsWith("#");
              const cls = `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                s.done
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border bg-background/40 hover:bg-primary/10 hover:border-primary/30"
              }`;
              const inner = (
                <>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${s.done ? "bg-success text-success-foreground" : "border border-border text-muted-foreground"}`}>
                    {s.done ? <Check className="w-2.5 h-2.5" /> : s.icon}
                  </span>
                  <span className={`font-medium ${s.done ? "line-through opacity-80" : ""}`}>{s.label}</span>
                </>
              );
              if (isAnchor) {
                return (
                  <a key={s.label} href={s.to} onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(s.to.slice(1));
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }} className={cls}>{inner}</a>
                );
              }
              return <Link key={s.label} to={s.to} className={cls}>{inner}</Link>;
            })}
          </div>
        </div>
      )}

      {/* Featured active package countdown */}
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
          <div className="mb-4 rounded-2xl p-[1.5px] bg-[image:var(--gradient-aurora)] animate-fade-in">
            <div className="rounded-2xl bg-background/85 backdrop-blur-xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] shrink-0">
                    {serviceIcon[featured.service] ?? <Sparkles className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[image:var(--gradient-gold)] text-gold-foreground font-bold">Active</span>
                      {matured && <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-success/20 text-success font-bold">Matured</span>}
                    </div>
                    <p className="font-extrabold text-base sm:text-lg mt-0.5 truncate">{featured.plan_name}</p>
                    <div className="text-xs mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span><span className="text-muted-foreground">Invested:</span> <span className="font-semibold">${Number(featured.amount).toLocaleString()}</span></span>
                      <span className="text-muted-foreground">•</span>
                      <span><span className="text-muted-foreground">Daily:</span> <span className="text-success font-semibold">{dailyPct.toFixed(3)}%</span></span>
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
                <p className="text-[11px] text-muted-foreground mt-2">+{activeInvs.length - 1} more active package{activeInvs.length - 1 === 1 ? "" : "s"} — see Investments tab</p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Binance UID — compact when set, expanded when missing */}
      {cust?.binance_uid && !uidEditing ? (
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpRight className="w-3.5 h-3.5 text-gold" />
            <span className="text-muted-foreground">Withdrawals →</span>
            <span className="font-mono font-semibold text-primary">Binance UID · {cust.binance_uid}</span>
          </div>
          <button
            type="button"
            onClick={() => { setUidInput(cust?.binance_uid ?? ""); setUidMsg(null); setUidEditing(true); }}
            className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Edit
          </button>
        </div>
      ) : (
        <div className={`mb-6 rounded-2xl border p-4 ${cust?.binance_uid ? "border-primary/30 bg-primary/5" : "border-destructive/40 bg-destructive/5"}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cust?.binance_uid ? "bg-[image:var(--gradient-gold)] text-gold-foreground" : "bg-destructive/20 text-destructive"}`}>
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {cust?.binance_uid ? "Update your Binance UID" : "Set your Binance UID to enable withdrawals."}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cust?.binance_uid ? "Payouts go to this UID within 24 hours." : "Without a UID on file we can't send your payouts."}
                </p>
              </div>
            </div>
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
                autoFocus={uidEditing}
                value={uidInput}
                onChange={(e) => setUidInput(e.target.value)}
                placeholder="284910321"
                className="rounded-lg glass px-3 py-1.5 text-xs font-mono w-40 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button type="submit" disabled={uidSaving || uidInput.trim().length < 3} className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground glow-primary disabled:opacity-60 inline-flex items-center gap-1">
                {uidSaving && <Loader2 className="w-3 h-3 animate-spin" />} Save
              </button>
              {cust?.binance_uid && (
                <button type="button" onClick={() => { setUidEditing(false); setUidMsg(null); }} className="text-xs text-muted-foreground hover:text-foreground px-2">Cancel</button>
              )}
            </form>
          </div>
          {uidMsg && <p className="text-xs text-destructive mt-2">{uidMsg}</p>}
        </div>
      )}

      {/* ── TABS ────────────────────────────────────────────────── */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="investments" id="investments-tab">Investments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="promos">Promotions</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-5">
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 relative rounded-2xl p-[1.5px] bg-[image:var(--gradient-aurora)] animate-fade-in">
              <div className="rounded-2xl bg-background/80 backdrop-blur-xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold tracking-tight">Quick Invest</h3>
                      <p className="text-xs text-muted-foreground">Start a new package in seconds</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-primary/20 bg-background/60 p-4">
                  <QuickInvestForm />
                </div>
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
        </TabsContent>

        {/* INVESTMENTS */}
        <TabsContent value="investments" className="mt-5 space-y-4">
          <OffersBanner />
          <GlassCard>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-semibold">Active Investments</h3>
                <p className="text-xs text-muted-foreground">{activeInvs.length} running · live updates</p>
              </div>
              <Link to="/mining" className="text-xs text-primary">Browse plans →</Link>
            </div>
            {activeInvs.length === 0 ? (
              <div className="text-center py-10">
                <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-4">No active investments yet.</p>
                <CTA to="/mining" variant="primary">Explore packages</CTA>
              </div>
            ) : (
              <ul className="grid sm:grid-cols-2 gap-3">
                {activeInvs.map((i) => {
                  const accrued = computeAccrual(i);
                  const start = i.started_at ? new Date(i.started_at).getTime() : new Date(i.created_at).getTime();
                  const end = i.ends_at ? new Date(i.ends_at).getTime() : start + 30 * 86_400_000;
                  const pct = Math.max(0, Math.min(100, Math.round(((now - start) / Math.max(1, end - start)) * 100)));
                  return (
                    <li key={i.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {serviceIcon[i.service] ?? <Sparkles className="w-4 h-4 text-primary" />}
                          <p className="font-semibold truncate">{i.plan_name}</p>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-success/15 text-success font-bold">Active</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground capitalize">{i.service.replace("_", " ")}</div>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Invested</p>
                          <p className="font-semibold">${Number(i.amount).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Earned</p>
                          <p className="font-mono text-success font-semibold">+${accrued.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</p>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-[image:var(--gradient-primary)] transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-right mt-1">{pct}%</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </GlassCard>
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity" className="mt-5">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">All Transactions</h3>
              <Link to="/transactions" className="text-xs text-primary">Full history →</Link>
            </div>
            {txns.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No transactions yet.</p>
            ) : (
              <ul className="divide-y divide-border/40">
                {txns.slice(0, 25).map((e) => {
                  const amt = Number(e.amount);
                  return (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="capitalize truncate">{e.notes ?? e.kind.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                          e.status === "approved" || e.status === "completed" ? "border-success/30 text-success" :
                          e.status === "pending" ? "border-gold/30 text-gold" :
                          "border-border text-muted-foreground"
                        }`}>{e.status}</span>
                        <span className={`font-medium ${amt >= 0 ? "text-success" : "text-gold"}`}>
                          {amt >= 0 ? "+" : ""}{amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </GlassCard>
        </TabsContent>

        {/* PROMOTIONS */}
        <TabsContent value="promos" className="mt-5 space-y-4">
          <div className="rounded-2xl border border-gold/40 bg-gold/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden">
            <div className="relative flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-[image:var(--gradient-gold)] text-gold-foreground flex items-center justify-center shrink-0 shadow-[var(--shadow-gold)]">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold"><span className="gradient-text">25% Deposit Bonus</span> — Limited time</p>
                <p className="text-xs text-muted-foreground mt-0.5">Top up your account now and receive an extra 25% credited after admin approval.</p>
              </div>
            </div>
            <Link to="/deposit" className="relative shrink-0 rounded-xl px-4 py-2 text-sm font-semibold bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold inline-flex items-center gap-2 hover:opacity-90 transition">
              <ArrowDownLeft className="w-4 h-4" /> Deposit & Claim 25%
            </Link>
          </div>
          {userId && <WelcomeBonusBanner userId={userId} />}
        </TabsContent>
      </Tabs>

      {/* Footer CTAs */}
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

function MiniKpi({ icon, label, value, sub, positive }: { icon: React.ReactNode; label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="text-primary">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className={`mt-1 font-extrabold tabular-nums ${positive ? "text-success" : "text-foreground"} text-base sm:text-lg`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
