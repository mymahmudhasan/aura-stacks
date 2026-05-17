import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Loader2, RefreshCw, Wifi, WifiOff, Clock, CheckCircle2, XCircle } from "lucide-react";
import { GlassCard, Section } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { getMyDeposits, getMyWithdrawals } from "@/lib/wallet.functions";

export const Route = createFileRoute("/transactions")({
  component: TxPage,
  head: () => ({ meta: [{ title: "My Transactions — AuraTrad.Ai" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
});

type Deposit = { id: string; amount: number; currency: string; network: string | null; tx_hash: string | null; status: string; created_at: string; approved_at: string | null; admin_notes: string | null };
type Withdrawal = { id: string; amount: number; currency: string; destination: string; destination_type: string; status: string; created_at: string; paid_at: string | null; admin_notes: string | null };
type Tab = "all" | "deposits" | "withdrawals";

function statusPill(status: string) {
  const s = status.toLowerCase();
  if (s === "approved" || s === "paid" || s === "completed")
    return { cls: "bg-success/15 text-success border-success/30", icon: <CheckCircle2 className="w-3 h-3" /> };
  if (s === "rejected" || s === "failed" || s === "cancelled")
    return { cls: "bg-destructive/15 text-destructive border-destructive/30", icon: <XCircle className="w-3 h-3" /> };
  return { cls: "bg-gold/15 text-gold border-gold/30", icon: <Clock className="w-3 h-3 animate-pulse" /> };
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function TxPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [live, setLive] = useState(false);
  const [pulse, setPulse] = useState<string | null>(null);

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    try {
      const [d, w] = await Promise.all([getMyDeposits(), getMyWithdrawals()]);
      setDeposits(d as Deposit[]);
      setWithdrawals(w as Withdrawal[]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(true); }, [load]);

  // Realtime subscription
  useEffect(() => {
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id ?? null;
      if (!userId) return;

      channel = supabase
        .channel(`tx-${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "deposits", filter: `user_id=eq.${userId}` }, (payload) => {
          const row = (payload.new ?? payload.old) as Deposit;
          setPulse(row.id);
          setTimeout(() => setPulse((p) => (p === row.id ? null : p)), 2500);
          load(false);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals", filter: `user_id=eq.${userId}` }, (payload) => {
          const row = (payload.new ?? payload.old) as Withdrawal;
          setPulse(row.id);
          setTimeout(() => setPulse((p) => (p === row.id ? null : p)), 2500);
          load(false);
        })
        .subscribe((status) => setLive(status === "SUBSCRIBED"));
    })();

    return () => { if (channel) supabase.removeChannel(channel); };
  }, [load]);

  // Force re-render every 30s so "x minutes ago" stays fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  type Row =
    | { kind: "deposit"; row: Deposit }
    | { kind: "withdrawal"; row: Withdrawal };

  const merged: Row[] = [
    ...deposits.map((r) => ({ kind: "deposit" as const, row: r })),
    ...withdrawals.map((r) => ({ kind: "withdrawal" as const, row: r })),
  ].sort((a, b) => +new Date(b.row.created_at) - +new Date(a.row.created_at));

  const list =
    tab === "deposits" ? merged.filter((r) => r.kind === "deposit") :
    tab === "withdrawals" ? merged.filter((r) => r.kind === "withdrawal") :
    merged;

  const pendingDeps = deposits.filter((d) => d.status === "pending").length;
  const pendingWds = withdrawals.filter((w) => w.status === "pending").length;
  const approvedDeps = deposits.filter((d) => d.status === "approved").length;
  const paidWds = withdrawals.filter((w) => w.status === "paid").length;

  return (
    <Section className="!py-10 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">My Transactions</h1>
            <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${live ? "border-success/40 text-success bg-success/10" : "border-muted text-muted-foreground bg-muted/20"}`}>
              {live ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />} {live ? "Live" : "Offline"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Real-time status of your deposits and withdrawals.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/deposit" className="rounded-xl px-3 py-2 text-sm font-semibold inline-flex items-center gap-2 bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold">
            <ArrowDownLeft className="w-4 h-4" /> Deposit
          </Link>
          <Link to="/withdraw" className="glass rounded-xl px-3 py-2 text-sm inline-flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-gold" /> Withdraw
          </Link>
          <button onClick={() => load(false)} disabled={refreshing} className="glass rounded-xl p-2" title="Refresh">
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatMini label="Pending deposits" value={pendingDeps} accent="gold" />
        <StatMini label="Approved deposits" value={approvedDeps} accent="success" />
        <StatMini label="Pending withdrawals" value={pendingWds} accent="gold" />
        <StatMini label="Paid withdrawals" value={paidWds} accent="success" />
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "deposits", "withdrawals"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${tab === t ? "bg-primary text-primary-foreground glow-primary" : "glass hover:bg-primary/10"}`}>
            {t}
          </button>
        ))}
      </div>

      <GlassCard>
        {list.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Link to="/deposit" className="text-xs px-3 py-1.5 rounded-lg bg-primary/15 text-primary">Make a deposit</Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {list.map((entry) => {
              const r = entry.row;
              const sp = statusPill(r.status);
              const isDep = entry.kind === "deposit";
              const dep = isDep ? (r as Deposit) : null;
              const wd = !isDep ? (r as Withdrawal) : null;
              const isPulse = pulse === r.id;
              return (
                <li key={`${entry.kind}-${r.id}`} className={`py-4 flex items-start gap-3 transition ${isPulse ? "bg-primary/5 -mx-4 px-4 rounded-lg" : ""}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDep ? "bg-success/15 text-success" : "bg-gold/15 text-gold"}`}>
                    {isDep ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">
                        {isDep ? "Deposit" : "Withdrawal"} · ${Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {r.currency}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${sp.cls}`}>
                        {sp.icon} {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isDep && dep ? (
                        <>Network <span className="text-foreground/80">{dep.network}</span>{dep.tx_hash ? <> · tx <code className="text-[11px]">{dep.tx_hash.slice(0, 16)}…</code></> : null}</>
                      ) : wd ? (
                        <>To <span className="text-foreground/80">{wd.destination_type}</span> · <code className="text-[11px]">{wd.destination}</code></>
                      ) : null}
                    </p>
                    {r.admin_notes && (
                      <p className="text-xs mt-1 text-muted-foreground"><span className="text-foreground/70">Admin:</span> {r.admin_notes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</p>
                    {isDep && dep?.approved_at && <p className="text-[10px] text-success mt-1">Approved {timeAgo(dep.approved_at)}</p>}
                    {!isDep && wd?.paid_at && <p className="text-[10px] text-success mt-1">Paid {timeAgo(wd.paid_at)}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
    </Section>
  );
}

function StatMini({ label, value, accent }: { label: string; value: number; accent: "gold" | "success" }) {
  const cls = accent === "gold" ? "text-gold" : "text-success";
  return (
    <div className="glass rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${cls}`}>{value}</p>
    </div>
  );
}
