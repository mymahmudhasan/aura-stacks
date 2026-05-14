import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Users, Wallet, Search, ShieldCheck, BadgeCheck, Clock, Cable, LogOut, Loader2,
  Phone, Globe2, LayoutDashboard, MessageSquare, BanknoteArrowUp, Copy, Check,
  Download, RefreshCw, Save, X, Filter, TrendingUp, AlertCircle,
} from "lucide-react";
import { GlassCard } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin")({
  component: Admin,
  head: () => ({ meta: [{ title: "Admin — NovaVault" }, { name: "robots", content: "noindex" }] }),
});

type Customer = Tables<"customers">;
type Ticket = Tables<"tickets">;
type Payout = Tables<"payout_runs">;

type Tab = "overview" | "customers" | "tickets" | "payouts";

function Admin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return navigate({ to: "/admin/login" });
      const { data: role } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", sess.session.user.id).eq("role", "admin").maybeSingle();
      if (!role) {
        await supabase.auth.signOut();
        return navigate({ to: "/admin/login" });
      }
      setAuthorized(true);
      setChecking(false);
      void loadAll();
    })();
  }, [navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const loadAll = async () => {
    setLoading(true);
    const [c, t, p] = await Promise.all([
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
      supabase.from("tickets").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("payout_runs").select("*").order("ran_at", { ascending: false }).limit(100),
    ]);
    setLoading(false);
    if (c.data) setCustomers(c.data);
    if (t.data) setTickets(t.data);
    if (p.data) setPayouts(p.data);
  };

  const totals = useMemo(() => ({
    customers: customers.length,
    deposits: customers.reduce((s, c) => s + Number(c.total_deposited ?? 0), 0),
    withdrawn: customers.reduce((s, c) => s + Number(c.total_withdrawn ?? 0), 0),
    balances: customers.reduce((s, c) => s + Number(c.balance ?? 0), 0),
    pending: customers.filter((c) => c.status === "pending").length,
    active: customers.filter((c) => c.status === "active").length,
    openTickets: tickets.filter((t) => t.status === "open" || t.status === "in_progress").length,
    paidLast24: payouts.filter((p) => Date.now() - new Date(p.ran_at).getTime() < 86400000).reduce((s, p) => s + Number(p.amount ?? 0), 0),
  }), [customers, tickets, payouts]);

  const updateCustomer = async (id: string, patch: Partial<Customer>) => {
    const { error } = await supabase.from("customers").update(patch).eq("id", id);
    if (error) {
      setToast({ kind: "err", msg: error.message });
      return false;
    }
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setToast({ kind: "ok", msg: "Saved" });
    return true;
  };

  const updateTicket = async (id: string, patch: Partial<Ticket>) => {
    const { error } = await supabase.from("tickets").update(patch).eq("id", id);
    if (error) return setToast({ kind: "err", msg: error.message });
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    setToast({ kind: "ok", msg: "Ticket updated" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  if (checking) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (!authorized) return null;

  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "customers", label: "Customers", icon: <Users className="w-4 h-4" />, badge: totals.pending || undefined },
    { id: "tickets", label: "Tickets", icon: <MessageSquare className="w-4 h-4" />, badge: totals.openTickets || undefined },
    { id: "payouts", label: "Payouts", icon: <BanknoteArrowUp className="w-4 h-4" /> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-5 py-6 md:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[11px] uppercase tracking-widest text-primary mb-2">
            <ShieldCheck className="w-3 h-3" /> Admin Console
          </div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">NovaVault <span className="gradient-text">Operations</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAll} disabled={loading} className="px-3 py-2 rounded-xl glass hover:border-primary/30 text-xs inline-flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={signOut} className="px-3 py-2 rounded-xl glass hover:border-destructive/40 text-xs inline-flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
        {navItems.map((n) => {
          const active = tab === n.id;
          return (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition border ${
                active ? "bg-primary text-primary-foreground border-primary glow-primary" : "glass border-border hover:border-primary/30"
              }`}>
              {n.icon}{n.label}
              {n.badge ? (
                <span className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold inline-flex items-center justify-center ${
                  active ? "bg-primary-foreground text-primary" : "bg-gold/20 text-gold"
                }`}>{n.badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <Overview totals={totals} customers={customers} tickets={tickets} payouts={payouts} onJump={setTab} />}
      {tab === "customers" && <CustomersTab customers={customers} loading={loading} onUpdate={updateCustomer} />}
      {tab === "tickets" && <TicketsTab tickets={tickets} loading={loading} onUpdate={updateTicket} />}
      {tab === "payouts" && <PayoutsTab payouts={payouts} customers={customers} loading={loading} />}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-2xl border backdrop-blur ${
          toast.kind === "ok" ? "bg-success/15 border-success/30 text-success" : "bg-destructive/15 border-destructive/30 text-destructive"
        }`}>
          <span className="inline-flex items-center gap-2">
            {toast.kind === "ok" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------------- Overview ---------------- */

function Overview({ totals, customers, tickets, payouts, onJump }: {
  totals: { customers: number; deposits: number; withdrawn: number; balances: number; pending: number; active: number; openTickets: number; paidLast24: number };
  customers: Customer[]; tickets: Ticket[]; payouts: Payout[];
  onJump: (t: Tab) => void;
}) {
  const recentCustomers = customers.slice(0, 5);
  const recentTickets = tickets.slice(0, 5);
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Users />} label="Customers" value={String(totals.customers)} trend={`${totals.active} active · ${totals.pending} pending`} />
        <Kpi icon={<Wallet />} label="Total Deposited" value={`$${totals.deposits.toLocaleString()}`} trend={`Withdrawn $${totals.withdrawn.toLocaleString()}`} />
        <Kpi icon={<TrendingUp />} label="Live Balances" value={`$${totals.balances.toLocaleString()}`} trend="Across all accounts" />
        <Kpi icon={<BanknoteArrowUp />} label="Paid (24h)" value={`$${totals.paidLast24.toLocaleString()}`} trend={`${payouts.length} runs total`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-5">
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Recent customers</h3>
            <button onClick={() => onJump("customers")} className="text-xs text-primary hover:underline">View all →</button>
          </div>
          <div className="space-y-2">
            {recentCustomers.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No customers yet.</p>}
            {recentCustomers.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg glass">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                </div>
                <StatusPill v={c.status} />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Open tickets</h3>
            <button onClick={() => onJump("tickets")} className="text-xs text-primary hover:underline">View all →</button>
          </div>
          <div className="space-y-2">
            {recentTickets.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No tickets yet.</p>}
            {recentTickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg glass">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.ticket_number} · {t.email}</p>
                </div>
                <TicketStatus v={t.status} />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </>
  );
}

/* ---------------- Customers ---------------- */

function CustomersTab({ customers, loading, onUpdate }: {
  customers: Customer[]; loading: boolean;
  onUpdate: (id: string, patch: Partial<Customer>) => Promise<boolean>;
}) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "suspended">("all");
  const [editId, setEditId] = useState<string | null>(null);

  const filtered = customers.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (!q) return true;
    return [c.full_name, c.email, c.phone, c.binance_uid, c.binance_wallet_address, c.country, c.referred_by]
      .filter(Boolean).some((v) => v!.toLowerCase().includes(q.toLowerCase()));
  });

  const exportCsv = () => {
    const headers = ["Name", "Email", "Phone", "Country", "Binance UID", "Wallet", "Balance", "Deposited", "Withdrawn", "Status", "Joined"];
    const rows = filtered.map((c) => [
      c.full_name, c.email, c.phone || "", c.country || "", c.binance_uid, c.binance_wallet_address || "",
      c.balance, c.total_deposited, c.total_withdrawn, c.status, new Date(c.created_at).toISOString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold">Customer Database</h3>
          <p className="text-xs text-muted-foreground">{filtered.length} of {customers.length} · click a row to edit</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
              className="pl-9 pr-3 py-2 w-full sm:w-64 rounded-xl bg-input/50 border border-border focus:border-primary outline-none text-sm" />
          </div>
          <button onClick={exportCsv} className="px-3 py-2 rounded-xl glass hover:border-primary/30 text-xs inline-flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto">
        <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {(["all", "active", "pending", "suspended"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider font-medium border ${
              statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "glass border-border"
            }`}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No customers match.<div className="mt-3"><Link to="/register" className="text-primary text-xs">Open registration page →</Link></div>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((c) => (
              <CustomerCard key={c.id} c={c} editing={editId === c.id} onEdit={() => setEditId(c.id)} onClose={() => setEditId(null)} onSave={onUpdate} />
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-widest text-muted-foreground bg-white/5">
                  {["Name", "Contact", "Country", "Binance UID", "Wallet", "Balance", "Deposited", "Status", "Joined", ""].map((h) => (
                    <th key={h} className="text-left font-medium px-3 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <CustomerRow key={c.id} c={c} editing={editId === c.id} onEdit={() => setEditId(c.id)} onClose={() => setEditId(null)} onSave={onUpdate} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </GlassCard>
  );
}

function CustomerRow({ c, editing, onEdit, onClose, onSave }: {
  c: Customer; editing: boolean; onEdit: () => void; onClose: () => void;
  onSave: (id: string, patch: Partial<Customer>) => Promise<boolean>;
}) {
  const [bal, setBal] = useState(String(c.balance));
  const [dep, setDep] = useState(String(c.total_deposited));
  const [status, setStatus] = useState(c.status);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setBal(String(c.balance)); setDep(String(c.total_deposited)); setStatus(c.status); }, [c, editing]);

  const save = async () => {
    setSaving(true);
    const ok = await onSave(c.id, { balance: Number(bal), total_deposited: Number(dep), status });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <tr className="border-t border-border/40 hover:bg-white/5">
      <Td>
        <p className="font-medium">{c.full_name}</p>
        <p className="text-[11px] text-muted-foreground">{c.referred_by ? `via ${c.referred_by}` : "Direct"}</p>
      </Td>
      <Td muted>
        <p className="truncate max-w-[180px]">{c.email}</p>
        <p className="text-[11px] inline-flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{c.phone || "—"}</p>
      </Td>
      <Td muted><span className="inline-flex items-center gap-1"><Globe2 className="w-3 h-3" />{c.country || "—"}</span></Td>
      <Td><CopyChip label={c.binance_uid} /></Td>
      <Td><CopyChip label={c.binance_wallet_address || "—"} truncate /></Td>
      <Td>
        {editing ? (
          <input type="number" value={bal} onChange={(e) => setBal(e.target.value)} className="w-24 px-2 py-1 rounded bg-input border border-primary/40 text-sm" />
        ) : <span className="font-semibold">${Number(c.balance).toLocaleString()}</span>}
      </Td>
      <Td>
        {editing ? (
          <input type="number" value={dep} onChange={(e) => setDep(e.target.value)} className="w-24 px-2 py-1 rounded bg-input border border-primary/40 text-sm" />
        ) : `$${Number(c.total_deposited).toLocaleString()}`}
      </Td>
      <Td>
        {editing ? (
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-2 py-1 rounded bg-input border border-primary/40 text-xs">
            <option value="pending">pending</option><option value="active">active</option><option value="suspended">suspended</option>
          </select>
        ) : <StatusPill v={c.status} />}
      </Td>
      <Td muted>{new Date(c.created_at).toLocaleDateString()}</Td>
      <Td>
        {editing ? (
          <div className="flex gap-1">
            <button onClick={save} disabled={saving} className="p-1.5 rounded-md bg-success/20 text-success hover:bg-success/30">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}</button>
            <button onClick={onClose} className="p-1.5 rounded-md glass"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <button onClick={onEdit} className="text-[11px] px-2 py-1 rounded-md glass hover:border-primary/40">Edit</button>
        )}
      </Td>
    </tr>
  );
}

function CustomerCard({ c, editing, onEdit, onClose, onSave }: {
  c: Customer; editing: boolean; onEdit: () => void; onClose: () => void;
  onSave: (id: string, patch: Partial<Customer>) => Promise<boolean>;
}) {
  const [bal, setBal] = useState(String(c.balance));
  const [dep, setDep] = useState(String(c.total_deposited));
  const [status, setStatus] = useState(c.status);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setBal(String(c.balance)); setDep(String(c.total_deposited)); setStatus(c.status); }, [c, editing]);

  const save = async () => {
    setSaving(true);
    const ok = await onSave(c.id, { balance: Number(bal), total_deposited: Number(dep), status });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div className="rounded-xl glass p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{c.full_name}</p>
          <p className="text-xs text-muted-foreground truncate">{c.email}</p>
        </div>
        <StatusPill v={c.status} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Field label="Balance">{editing ? <input type="number" value={bal} onChange={(e) => setBal(e.target.value)} className="w-full px-2 py-1 rounded bg-input border border-primary/40" /> : <span className="font-semibold">${Number(c.balance).toLocaleString()}</span>}</Field>
        <Field label="Deposited">{editing ? <input type="number" value={dep} onChange={(e) => setDep(e.target.value)} className="w-full px-2 py-1 rounded bg-input border border-primary/40" /> : `$${Number(c.total_deposited).toLocaleString()}`}</Field>
        <Field label="Country">{c.country || "—"}</Field>
        <Field label="Phone">{c.phone || "—"}</Field>
        <Field label="Binance UID" full><CopyChip label={c.binance_uid} /></Field>
        <Field label="Wallet" full><CopyChip label={c.binance_wallet_address || "—"} truncate /></Field>
        {editing && (
          <Field label="Status" full>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-2 py-1 rounded bg-input border border-primary/40">
              <option value="pending">pending</option><option value="active">active</option><option value="suspended">suspended</option>
            </select>
          </Field>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        {editing ? (
          <>
            <button onClick={save} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-success/20 text-success text-xs font-medium">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
            </button>
            <button onClick={onClose} className="px-3 py-2 rounded-lg glass text-xs"><X className="w-3.5 h-3.5" /></button>
          </>
        ) : (
          <button onClick={onEdit} className="flex-1 px-3 py-2 rounded-lg glass text-xs font-medium hover:border-primary/30">Edit customer</button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
      <div className="text-xs">{children}</div>
    </div>
  );
}

/* ---------------- Tickets ---------------- */

function TicketsTab({ tickets, loading, onUpdate }: {
  tickets: Ticket[]; loading: boolean;
  onUpdate: (id: string, patch: Partial<Ticket>) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = tickets.filter((t) => !q || [t.subject, t.email, t.ticket_number, t.full_name].some((v) => v?.toLowerCase().includes(q.toLowerCase())));

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold">Support Tickets</h3>
          <p className="text-xs text-muted-foreground">{filtered.length} of {tickets.length}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tickets…"
            className="pl-9 pr-3 py-2 w-full sm:w-64 rounded-xl bg-input/50 border border-border focus:border-primary outline-none text-sm" />
        </div>
      </div>
      {loading ? (
        <div className="py-16 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No tickets.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="rounded-xl glass p-3.5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-primary">{t.ticket_number}</span>
                    <PriorityPill v={t.priority} />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.category}</span>
                  </div>
                  <p className="font-medium mt-1">{t.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.full_name} · {t.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={t.status} onChange={(e) => onUpdate(t.id, { status: e.target.value as Ticket["status"], resolved_at: e.target.value === "resolved" ? new Date().toISOString() : null })}
                    className="px-2 py-1.5 rounded-lg bg-input border border-border text-xs">
                    <option value="open">open</option>
                    <option value="in_progress">in_progress</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </select>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{t.message}</p>
              <p className="mt-2 text-[10px] text-muted-foreground">Opened {new Date(t.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

/* ---------------- Payouts ---------------- */

function PayoutsTab({ payouts, customers, loading }: { payouts: Payout[]; customers: Customer[]; loading: boolean }) {
  const map = useMemo(() => Object.fromEntries(customers.map((c) => [c.user_id, c])), [customers]);
  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Payout Runs</h3>
          <p className="text-xs text-muted-foreground">Latest 100 payouts processed</p>
        </div>
      </div>
      {loading ? (
        <div className="py-16 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : payouts.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No payouts yet.</p>
      ) : (
        <div className="space-y-2">
          {payouts.map((p) => {
            const c = map[p.user_id];
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg glass">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c?.full_name ?? p.user_id.slice(0, 8)}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{p.method} · {new Date(p.ran_at).toLocaleString()}</p>
                </div>
                <span className="text-sm font-semibold text-success shrink-0">+${Number(p.amount).toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}

/* ---------------- Bits ---------------- */

function Kpi({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <GlassCard className="!p-4">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/15 text-primary">{icon}</div>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-3">{label}</p>
      <p className="text-xl md:text-2xl font-bold mt-0.5">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1 truncate">{trend}</p>
    </GlassCard>
  );
}

function Td({ children, muted, className = "" }: { children: React.ReactNode; muted?: boolean; className?: string }) {
  return <td className={`px-3 py-3 align-middle ${muted ? "text-muted-foreground" : ""} ${className}`}>{children}</td>;
}

function StatusPill({ v }: { v: string }) {
  const map: Record<string, string> = {
    active: "bg-success/15 text-success border-success/20",
    pending: "bg-gold/15 text-gold border-gold/20",
    suspended: "bg-destructive/15 text-destructive border-destructive/20",
  };
  const Icon = v === "active" ? BadgeCheck : Clock;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium capitalize border ${map[v] || "glass"}`}>
      <Icon className="w-2.5 h-2.5" /> {v}
    </span>
  );
}

function TicketStatus({ v }: { v: string }) {
  const map: Record<string, string> = {
    open: "bg-primary/15 text-primary",
    in_progress: "bg-gold/15 text-gold",
    resolved: "bg-success/15 text-success",
    closed: "bg-muted text-muted-foreground",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${map[v] || "glass"}`}>{v.replace("_", " ")}</span>;
}

function PriorityPill({ v }: { v: string }) {
  const map: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    normal: "bg-primary/15 text-primary",
    high: "bg-gold/15 text-gold",
    urgent: "bg-destructive/15 text-destructive",
  };
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${map[v] || "glass"}`}>{v}</span>;
}

function CopyChip({ label, truncate }: { label: string; truncate?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!label || label === "—") return <span className="text-muted-foreground text-xs">—</span>;
  const copy = () => {
    navigator.clipboard?.writeText(label);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button onClick={copy} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md glass hover:border-primary/30 font-mono text-[11px] ${truncate ? "max-w-[160px]" : ""}`}>
      <span className={truncate ? "truncate" : ""}>{label}</span>
      {copied ? <Check className="w-3 h-3 text-success shrink-0" /> : <Copy className="w-3 h-3 text-muted-foreground shrink-0" />}
    </button>
  );
}
