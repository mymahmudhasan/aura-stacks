import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Cpu, Lock, Brain, Copy, Check, Users, TrendingUp, Share2, ArrowUpRight, ExternalLink, Loader2 } from "lucide-react";
import { CTA, GlassCard, Section } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/referrals")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
    return { userId: data.user.id };
  },
  component: Referrals,
  head: () => ({ meta: [{ title: "Referral Dashboard — AuraTrad.Ai" }] }),
});

const SERVICE_META = {
  "ai-trading": { name: "AI Trading", icon: <Brain className="w-5 h-5" />, accent: "primary" as const, href: "/ai-trading", rates: { l1: "12%", l2: "5%", profit: "2%" } },
  "mining":     { name: "Mining",     icon: <Cpu className="w-5 h-5" />,   accent: "primary" as const, href: "/mining",     rates: { l1: "8%",  l2: "3%", profit: "1%" } },
  "staking":    { name: "Staking",    icon: <Lock className="w-5 h-5" />,  accent: "gold"    as const, href: "/staking",    rates: { l1: "6%",  l2: "2%", profit: "0.5%" } },
} as const;

type ServiceKey = keyof typeof SERVICE_META;
const SERVICE_KEYS: ServiceKey[] = ["ai-trading", "mining", "staking"];

type SummaryRow = {
  service: ServiceKey;
  direct_count: number;
  network_count: number;
  lifetime_earned: number;
  earned_last_24h: number;
};

type EarningRow = {
  id: string;
  service: ServiceKey;
  level: number;
  amount: number;
  description: string | null;
  source_handle: string | null;
  created_at: string;
};

type PayoutInfo = {
  next_payout_at: string;
  pending_amount: number;
  last_paid_at: string | null;
  min_amount: number;
  method: string;
  cadence_hours: number;
};

function countdown(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return "any moment";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `in ${d}d ${h}h ${m}m`;
  if (h > 0) return `in ${h}h ${m}m`;
  if (m > 0) return `in ${m}m ${sec}s`;
  return `in ${sec}s`;
}

function shortId(uuid: string) {
  return uuid.replace(/-/g, "").slice(0, 6);
}

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}

function Referrals() {
  const { userId } = Route.useRouteContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [activity, setActivity] = useState<EarningRow[]>([]);
  const [monthEarned, setMonthEarned] = useState(0);
  const [lastMonthEarned, setLastMonthEarned] = useState(0);
  const [payout, setPayout] = useState<PayoutInfo | null>(null);
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const referralId = useMemo(() => shortId(userId), [userId]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

        const [summaryRes, activityRes, monthRes, lastMonthRes, payoutRes] = await Promise.all([
          supabase.rpc("get_referral_summary", { _user_id: userId }),
          supabase
            .from("referral_earnings")
            .select("id, service, level, amount, description, source_handle, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("referral_earnings")
            .select("amount")
            .eq("user_id", userId)
            .gte("created_at", monthStart),
          supabase
            .from("referral_earnings")
            .select("amount")
            .eq("user_id", userId)
            .gte("created_at", lastMonthStart)
            .lt("created_at", monthStart),
          supabase.rpc("get_next_payout", { _user_id: userId }),
        ]);

        if (cancel) return;
        if (summaryRes.error) throw summaryRes.error;
        if (activityRes.error) throw activityRes.error;
        if (payoutRes.error) throw payoutRes.error;

        const rows = (summaryRes.data ?? []) as Array<{ service: string; direct_count: number | string; network_count: number | string; lifetime_earned: number | string; earned_last_24h: number | string }>;
        const normalized: SummaryRow[] = SERVICE_KEYS.map((key) => {
          const r = rows.find((x) => x.service === key);
          return {
            service: key,
            direct_count: Number(r?.direct_count ?? 0),
            network_count: Number(r?.network_count ?? 0),
            lifetime_earned: Number(r?.lifetime_earned ?? 0),
            earned_last_24h: Number(r?.earned_last_24h ?? 0),
          };
        });

        setSummary(normalized);
        setActivity((activityRes.data ?? []) as EarningRow[]);
        setMonthEarned((monthRes.data ?? []).reduce((s, r: { amount: number | string }) => s + Number(r.amount), 0));
        setLastMonthEarned((lastMonthRes.data ?? []).reduce((s, r: { amount: number | string }) => s + Number(r.amount), 0));
        const p = (payoutRes.data ?? [])[0] as { next_payout_at: string; pending_amount: number | string; last_paid_at: string | null; min_amount: number | string; method: string; cadence_hours: number } | undefined;
        if (p) {
          setPayout({
            next_payout_at: p.next_payout_at,
            pending_amount: Number(p.pending_amount),
            last_paid_at: p.last_paid_at,
            min_amount: Number(p.min_amount),
            method: p.method,
            cadence_hours: p.cadence_hours,
          });
        }
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : "Failed to load referral data");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [userId]);

  const totals = useMemo(() => ({
    direct:  summary.reduce((s, x) => s + x.direct_count, 0),
    network: summary.reduce((s, x) => s + x.network_count, 0),
    earned:  summary.reduce((s, x) => s + x.lifetime_earned, 0),
    perDay:  summary.reduce((s, x) => s + x.earned_last_24h, 0),
  }), [summary]);

  // Live counter — accrues per-second based on last-24h earning rate.
  const perSecond = totals.perDay / 86400;
  const [live, setLive] = useState(0);
  useEffect(() => { setLive(totals.earned); }, [totals.earned]);
  useEffect(() => {
    if (perSecond <= 0) return;
    const id = setInterval(() => setLive((v) => v + perSecond), 1000);
    return () => clearInterval(id);
  }, [perSecond]);

  return (
    <Section className="!py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground">Referral Dashboard</p>
          <h1 className="text-2xl md:text-3xl font-bold">Your <span className="gradient-text">network &amp; earnings</span></h1>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard" className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2">← Back to dashboard</Link>
          <Link to="/affiliate" className="glass rounded-xl px-4 py-2 text-sm flex items-center gap-2"><ExternalLink className="w-4 h-4 text-primary" /> Program rules</Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm p-4 mb-6">
          {error}
        </div>
      )}

      {/* LIVE EARNINGS HERO */}
      <div className="relative rounded-3xl glass-strong p-6 md:p-8 overflow-hidden mb-6">
        <div className="absolute inset-0 bg-[image:var(--gradient-aurora)] opacity-50 pointer-events-none" />
        <div className="relative grid md:grid-cols-4 gap-5 items-center">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-primary mb-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs uppercase tracking-widest">Live commission earnings</span>
            </div>
            <p className="text-4xl md:text-5xl font-bold gradient-text font-mono tracking-tight">
              {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : `$${live.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Last 24h: ${totals.perDay.toFixed(2)} · auto-paid every Sunday to your Binance wallet.</p>
          </div>
          <SmallStat icon={<Users />} label="Direct (L1)" value={loading ? "—" : String(totals.direct)} sub="active referrals" />
          <SmallStat icon={<Users />} label="Network (L2)" value={loading ? "—" : String(totals.network)} sub="extended network" />
        </div>
      </div>

      {/* MASTER LINK */}
      <CopyLinkCard
        label="Master referral link"
        url={`https://auratrad.ai/r/${referralId}`}
        note="Shares all services. Use service-specific links below for higher conversion."
      />

      {/* PER-SERVICE GRID */}
      <h2 className="mt-10 mb-4 text-lg font-semibold">Per-service performance</h2>
      <div className="grid lg:grid-cols-3 gap-5">
        {SERVICE_KEYS.map((key) => {
          const row = summary.find((s) => s.service === key) ?? { service: key, direct_count: 0, network_count: 0, lifetime_earned: 0, earned_last_24h: 0 };
          return <ServiceCard key={key} svcKey={key} row={row} referralId={referralId} loading={loading} />;
        })}
      </div>

      {/* RECENT EVENTS */}
      <div className="mt-8 grid lg:grid-cols-3 gap-5">
        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold mb-4">Recent referral activity</h3>
          {loading ? (
            <div className="py-8 flex justify-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">No activity yet — share your link to start earning.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {activity.map((e) => {
                const who = `${e.level === 2 ? "L2 · " : ""}${e.source_handle ?? "anon"}`;
                const svc = SERVICE_META[e.service]?.name ?? e.service;
                const amt = Number(e.amount);
                return (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/30 last:border-0">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{who} <span className="text-muted-foreground font-normal">{e.description ?? "commission credited"}</span></p>
                      <p className="text-xs text-muted-foreground">{timeAgo(e.created_at)} · {svc}</p>
                    </div>
                    <span className={amt === 0 ? "text-muted-foreground text-xs" : "text-success font-medium font-mono whitespace-nowrap"}>
                      {amt === 0 ? "—" : `+$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-4">Payouts</h3>
          {payout && (() => {
            void nowTick;
            const next = new Date(payout.next_payout_at);
            const eligible = payout.pending_amount >= payout.min_amount;
            return (
              <div className="rounded-xl bg-background/40 border border-border/40 p-3 mb-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Next payout</p>
                <p className="text-xl font-bold font-mono gradient-text mt-0.5">{countdown(next)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {next.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Pending</span>
                  <span className={`font-mono font-medium ${eligible ? "text-success" : "text-muted-foreground"}`}>
                    ${payout.pending_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {!eligible && (
                  <p className="text-[11px] text-gold mt-1">Min ${payout.min_amount.toFixed(2)} required to release.</p>
                )}
              </div>
            );
          })()}
          <div className="space-y-3 text-sm">
            <Row k="This month" v={`$${monthEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} tone="text-success" />
            <Row k="Last month" v={`$${lastMonthEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <Row k="Lifetime" v={`$${totals.earned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} tone="text-success" />
            <Row k="Last paid" v={payout?.last_paid_at ? timeAgo(payout.last_paid_at) : "—"} />
            <Row k="Method" v={payout?.method ?? "Binance · USDT"} />
          </div>
          <div className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowUpRight className="w-3.5 h-3.5 text-gold" /> Payouts settle automatically every {payout?.cadence_hours ?? 24}h.
          </div>
        </GlassCard>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <CTA to="/affiliate" variant="gold">View commission rules</CTA>
        <CTA to="/dashboard" variant="ghost">Back to dashboard</CTA>
      </div>
    </Section>
  );
}

function ServiceCard({ svcKey, row, referralId, loading }: { svcKey: ServiceKey; row: SummaryRow; referralId: string; loading: boolean }) {
  const meta = SERVICE_META[svcKey];
  const url = `https://auratrad.ai/r/${referralId}?p=${svcKey}`;
  return (
    <div className={`relative rounded-2xl p-6 ${meta.accent === "gold" ? "glass-strong border-primary/40 glow-gold" : "glass"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl ${meta.accent === "gold" ? "bg-[image:var(--gradient-gold)] text-gold-foreground" : "bg-primary/15 text-primary"} flex items-center justify-center`}>{meta.icon}</div>
          <div>
            <p className="font-semibold">{meta.name}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">L1 {meta.rates.l1} · L2 {meta.rates.l2} · Share {meta.rates.profit}</p>
          </div>
        </div>
        <Link to={meta.href} className="text-xs text-primary hover:underline inline-flex items-center gap-1">View <ExternalLink className="w-3 h-3" /></Link>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Mini label="Direct"  value={loading ? "—" : String(row.direct_count)} icon={<Users className="w-3.5 h-3.5" />} />
        <Mini label="Network" value={loading ? "—" : String(row.network_count)} icon={<Share2 className="w-3.5 h-3.5" />} />
        <Mini label="Last 24h" value={loading ? "—" : `$${row.earned_last_24h.toFixed(2)}`} icon={<TrendingUp className="w-3.5 h-3.5" />} />
      </div>

      <div className="rounded-xl bg-background/40 border border-border/40 p-3 mb-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Lifetime earned</p>
        <p className="text-2xl font-bold font-mono gradient-text">${row.lifetime_earned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>

      <CopyLinkCard label={`${meta.name} link`} url={url} compact />
    </div>
  );
}

function CopyLinkCard({ label, url, note, compact }: { label: string; url: string; note?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };
  return (
    <div className={`rounded-xl glass ${compact ? "p-3" : "p-4"} flex items-center gap-3`}>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-xs sm:text-sm font-mono mt-0.5 truncate">{url}</p>
        {note && <p className="text-[11px] text-muted-foreground mt-1">{note}</p>}
      </div>
      <button
        onClick={copy}
        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${copied ? "bg-success/20 text-success" : "bg-primary text-primary-foreground glow-primary hover:opacity-90"}`}
      >
        {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
      </button>
    </div>
  );
}

function SmallStat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl glass p-4">
      <div className="flex items-center gap-2 text-primary"><div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">{icon}</div><span className="text-xs uppercase tracking-widest">{label}</span></div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Mini({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-background/30 border border-border/30 p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] uppercase tracking-widest">{icon}{label}</div>
      <p className="text-sm font-semibold mt-1">{value}</p>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-muted-foreground">{k}</span>
      <span className={`font-medium font-mono ${tone ?? ""}`}>{v}</span>
    </div>
  );
}
