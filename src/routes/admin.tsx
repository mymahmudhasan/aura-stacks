import { createFileRoute, useNavigate, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Users, Wallet, Search, ShieldCheck, BadgeCheck, Clock, LogOut, Loader2,
  Phone, Globe2, LayoutDashboard, MessageSquare, BanknoteArrowUp, Copy, Check,
  Download, RefreshCw, Save, X, Filter, TrendingUp, AlertCircle,
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, Settings, Trophy, Package,
  Headphones,
} from "lucide-react";
import { GlassCard } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { usePoolSettings, DEFAULT_POOL_SETTINGS } from "@/hooks/use-pool-settings";
import { PackagesTab } from "@/components/admin/PackagesTab";
import { AdminLiveChatTab } from "@/components/admin/AdminLiveChatTab";

export const Route = createFileRoute("/admin")({
  component: Admin,
  head: () => ({ meta: [{ title: "Admin — AuraTrad.Ai" }, { name: "robots", content: "noindex" }] }),
});

type Customer = Tables<"customers">;
type Ticket = Tables<"tickets">;
type Payout = Tables<"payout_runs">;

type Tab = "overview" | "customers" | "tickets" | "livechat" | "payouts" | "packages" | "settings";
type SortDir = "asc" | "desc";
type Overview = {
  customers_total: number; customers_active: number; customers_pending: number; customers_suspended: number;
  total_deposited: number; total_withdrawn: number; total_balances: number;
  open_tickets: number; payouts_total: number; paid_last_24h: number;
};

const PAGE_SIZE = 25;

function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [adminName, setAdminName] = useState<string>("Support");

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return navigate({ to: "/login" });
      const { data: role } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", sess.session.user.id).eq("role", "admin").maybeSingle();
      if (!role) {
        return navigate({ to: "/dashboard" });
      }
      const { data: prof } = await supabase
        .from("profiles").select("full_name").eq("id", sess.session.user.id).maybeSingle();
      if (prof?.full_name) setAdminName(prof.full_name);
      setAuthorized(true);
      setChecking(false);
      void loadOverview();
    })();
  }, [navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const loadOverview = useCallback(async () => {
    const [{ data: ov }, recC, recT] = await Promise.all([
      supabase.rpc("get_admin_overview").maybeSingle(),
      supabase.from("customers").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("tickets").select("*").order("created_at", { ascending: false }).limit(5),
    ]);
    if (ov) setOverview(ov as unknown as Overview);
    if (recC.data) setRecentCustomers(recC.data);
    if (recT.data) setRecentTickets(recT.data);
  }, []);

  const showToast = useCallback((kind: "ok" | "err", msg: string) => setToast({ kind, msg }), []);

  if (checking) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (!authorized) return null;
  if (location.pathname !== "/admin") return <Outlet />;

  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "customers", label: "Customers", icon: <Users className="w-4 h-4" />, badge: overview?.customers_pending || undefined },
    { id: "tickets", label: "Tickets", icon: <MessageSquare className="w-4 h-4" />, badge: overview?.open_tickets || undefined },
    { id: "payouts", label: "Payouts", icon: <BanknoteArrowUp className="w-4 h-4" /> },
    { id: "packages", label: "Packages", icon: <Package className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-5 py-6 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[11px] uppercase tracking-widest text-primary mb-2">
            <ShieldCheck className="w-3 h-3" /> Admin Console
          </div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">AuraTrad.Ai <span className="gradient-text">Operations</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadOverview} className="px-3 py-2 rounded-xl glass hover:border-primary/30 text-xs inline-flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={signOut} className="px-3 py-2 rounded-xl glass hover:border-destructive/40 text-xs inline-flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>

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
        <Link
          to="/admin/operations"
          className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition border bg-gold/15 border-gold/40 text-gold hover:bg-gold/25"
        >
          <Wallet className="w-4 h-4" /> Deposits & Withdrawals
        </Link>
      </div>

      {tab === "overview" && <OverviewTab ov={overview} recentCustomers={recentCustomers} recentTickets={recentTickets} onJump={setTab} />}
      {tab === "customers" && <CustomersTab onToast={showToast} onMutated={loadOverview} />}
      {tab === "tickets" && <TicketsTab onToast={showToast} onMutated={loadOverview} />}
      {tab === "payouts" && <PayoutsTab />}
      {tab === "packages" && <PackagesTab onToast={showToast} />}
      {tab === "settings" && <SettingsTab onToast={showToast} />}

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

function OverviewTab({ ov, recentCustomers, recentTickets, onJump }: {
  ov: Overview | null; recentCustomers: Customer[]; recentTickets: Ticket[]; onJump: (t: Tab) => void;
}) {
  const stat = ov ?? { customers_total: 0, customers_active: 0, customers_pending: 0, customers_suspended: 0, total_deposited: 0, total_withdrawn: 0, total_balances: 0, open_tickets: 0, payouts_total: 0, paid_last_24h: 0 };
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Users />} label="Customers" value={String(stat.customers_total)} trend={`${stat.customers_active} active · ${stat.customers_pending} pending`} />
        <Kpi icon={<Wallet />} label="Total Deposited" value={`$${Number(stat.total_deposited).toLocaleString()}`} trend={`Withdrawn $${Number(stat.total_withdrawn).toLocaleString()}`} />
        <Kpi icon={<TrendingUp />} label="Live Balances" value={`$${Number(stat.total_balances).toLocaleString()}`} trend="Across all accounts" />
        <Kpi icon={<BanknoteArrowUp />} label="Paid (24h)" value={`$${Number(stat.paid_last_24h).toLocaleString()}`} trend={`${stat.payouts_total} runs total`} />
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

type CustomerSortKey = "created_at" | "full_name" | "email" | "balance" | "total_deposited" | "status";

function CustomersTab({ onToast, onMutated }: { onToast: (k: "ok" | "err", m: string) => void; onMutated: () => void }) {
  const [rows, setRows] = useState<Customer[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<CustomerSortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "suspended">("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setQ(qInput.trim()); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => { setPage(0); }, [statusFilter, sortKey, sortDir]);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("customers").select("*", { count: "exact" });
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (q) {
      const esc = q.replace(/[%,]/g, " ");
      query = query.or(
        `full_name.ilike.%${esc}%,email.ilike.%${esc}%,phone.ilike.%${esc}%,binance_uid.ilike.%${esc}%,binance_wallet_address.ilike.%${esc}%,country.ilike.%${esc}%,referred_by.ilike.%${esc}%`
      );
    }
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error, count: cnt } = await query
      .order(sortKey, { ascending: sortDir === "asc" })
      .range(from, to);
    setLoading(false);
    if (error) { onToast("err", error.message); return; }
    setRows(data ?? []);
    setCount(cnt ?? 0);
  }, [page, sortKey, sortDir, q, statusFilter, onToast]);

  useEffect(() => { void fetchPage(); }, [fetchPage]);

  const updateCustomer = async (id: string, patch: Partial<Customer>) => {
    const { error } = await supabase.from("customers").update(patch).eq("id", id);
    if (error) { onToast("err", error.message); return false; }
    setRows((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    onToast("ok", "Saved");
    onMutated();
    return true;
  };

  const exportCsv = async () => {
    setExporting(true);
    // Stream all matching rows in chunks of 1000
    let all: Customer[] = [];
    let from = 0;
    const CHUNK = 1000;
    while (true) {
      let query = supabase.from("customers").select("*");
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (q) {
        const esc = q.replace(/[%,]/g, " ");
        query = query.or(
          `full_name.ilike.%${esc}%,email.ilike.%${esc}%,phone.ilike.%${esc}%,binance_uid.ilike.%${esc}%,binance_wallet_address.ilike.%${esc}%,country.ilike.%${esc}%,referred_by.ilike.%${esc}%`
        );
      }
      const { data, error } = await query
        .order(sortKey, { ascending: sortDir === "asc" })
        .range(from, from + CHUNK - 1);
      if (error) { onToast("err", error.message); setExporting(false); return; }
      if (!data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < CHUNK) break;
      from += CHUNK;
    }
    const headers = ["Name", "Email", "Phone", "Country", "Binance UID", "Wallet", "Balance", "Deposited", "Withdrawn", "Status", "Joined"];
    const csvRows = all.map((c) => [
      c.full_name, c.email, c.phone || "", c.country || "", c.binance_uid, c.binance_wallet_address || "",
      c.balance, c.total_deposited, c.total_withdrawn, c.status, new Date(c.created_at).toISOString(),
    ]);
    const csv = [headers, ...csvRows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const toggleSort = (key: CustomerSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold">Customer Database</h3>
          <p className="text-xs text-muted-foreground">{count.toLocaleString()} total · page {page + 1} of {Math.max(1, Math.ceil(count / PAGE_SIZE))}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Search…"
              className="pl-9 pr-3 py-2 w-full sm:w-64 rounded-xl bg-input/50 border border-border focus:border-primary outline-none text-sm" />
          </div>
          <button onClick={exportCsv} disabled={exporting} className="px-3 py-2 rounded-xl glass hover:border-primary/30 text-xs inline-flex items-center gap-1.5 disabled:opacity-50">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} CSV
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
      ) : rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No customers match.<div className="mt-3"><Link to="/register" className="text-primary text-xs">Open registration page →</Link></div>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-2">
            {rows.map((c) => (
              <CustomerCard key={c.id} c={c} editing={editId === c.id} onEdit={() => setEditId(c.id)} onClose={() => setEditId(null)} onSave={updateCustomer} />
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-widest text-muted-foreground bg-white/5">
                  <SortTh active={sortKey === "full_name"} dir={sortDir} onClick={() => toggleSort("full_name")}>Name</SortTh>
                  <SortTh active={sortKey === "email"} dir={sortDir} onClick={() => toggleSort("email")}>Contact</SortTh>
                  <th className="text-left font-medium px-3 py-2.5">Country</th>
                  <th className="text-left font-medium px-3 py-2.5">Binance UID</th>
                  <th className="text-left font-medium px-3 py-2.5">Wallet</th>
                  <SortTh active={sortKey === "balance"} dir={sortDir} onClick={() => toggleSort("balance")}>Balance</SortTh>
                  <SortTh active={sortKey === "total_deposited"} dir={sortDir} onClick={() => toggleSort("total_deposited")}>Deposited</SortTh>
                  <SortTh active={sortKey === "status"} dir={sortDir} onClick={() => toggleSort("status")}>Status</SortTh>
                  <SortTh active={sortKey === "created_at"} dir={sortDir} onClick={() => toggleSort("created_at")}>Joined</SortTh>
                  <th className="text-left font-medium px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <CustomerRow key={c.id} c={c} editing={editId === c.id} onEdit={() => setEditId(c.id)} onClose={() => setEditId(null)} onSave={updateCustomer} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Pager page={page} pageSize={PAGE_SIZE} count={count} onChange={setPage} />
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
      <Td><CopyChip label={c.binance_uid || "—"} /></Td>
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
        <Field label="Binance UID" full><CopyChip label={c.binance_uid || "—"} /></Field>
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

type TicketSortKey = "created_at" | "updated_at" | "subject" | "status" | "priority";
type TicketStatusFilter = "all" | "open" | "in_progress" | "resolved" | "closed";

function TicketsTab({ onToast, onMutated }: { onToast: (k: "ok" | "err", m: string) => void; onMutated: () => void }) {
  const [rows, setRows] = useState<Ticket[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<TicketSortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>("all");

  useEffect(() => {
    const t = setTimeout(() => { setQ(qInput.trim()); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => { setPage(0); }, [statusFilter, sortKey, sortDir]);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("tickets").select("*", { count: "exact" });
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (q) {
      const esc = q.replace(/[%,]/g, " ");
      query = query.or(
        `subject.ilike.%${esc}%,email.ilike.%${esc}%,full_name.ilike.%${esc}%,ticket_number.ilike.%${esc}%`
      );
    }
    const from = page * PAGE_SIZE;
    const { data, error, count: cnt } = await query
      .order(sortKey, { ascending: sortDir === "asc" })
      .range(from, from + PAGE_SIZE - 1);
    setLoading(false);
    if (error) { onToast("err", error.message); return; }
    setRows(data ?? []);
    setCount(cnt ?? 0);
  }, [page, sortKey, sortDir, q, statusFilter, onToast]);

  useEffect(() => { void fetchPage(); }, [fetchPage]);

  const updateTicket = async (id: string, patch: Partial<Ticket>) => {
    const { error } = await supabase.from("tickets").update(patch).eq("id", id);
    if (error) return onToast("err", error.message);
    setRows((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    onToast("ok", "Ticket updated");
    onMutated();
  };

  const toggleSort = (key: TicketSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold">Support Tickets</h3>
          <p className="text-xs text-muted-foreground">{count.toLocaleString()} total · page {page + 1} of {Math.max(1, Math.ceil(count / PAGE_SIZE))}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Search tickets…"
            className="pl-9 pr-3 py-2 w-full sm:w-64 rounded-xl bg-input/50 border border-border focus:border-primary outline-none text-sm" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {(["all", "open", "in_progress", "resolved", "closed"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider font-medium border ${
              statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "glass border-border"
            }`}>{s.replace("_", " ")}</button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <SortChip label="Newest" active={sortKey === "created_at" && sortDir === "desc"} onClick={() => { setSortKey("created_at"); setSortDir("desc"); }} />
          <SortChip label="Updated" active={sortKey === "updated_at" && sortDir === "desc"} onClick={() => { setSortKey("updated_at"); setSortDir("desc"); }} />
          <SortChip label="Priority" active={sortKey === "priority"} onClick={() => toggleSort("priority")} />
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No tickets.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((t) => (
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
                  <select value={t.status} onChange={(e) => updateTicket(t.id, { status: e.target.value as Ticket["status"], resolved_at: e.target.value === "resolved" ? new Date().toISOString() : null })}
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

      <Pager page={page} pageSize={PAGE_SIZE} count={count} onChange={setPage} />
    </GlassCard>
  );
}

/* ---------------- Payouts ---------------- */

type PayoutSortKey = "ran_at" | "amount";

function PayoutsTab() {
  const [rows, setRows] = useState<Payout[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<PayoutSortKey>("ran_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [customerMap, setCustomerMap] = useState<Record<string, Customer>>({});
  const cacheRef = useRef<Record<string, Customer>>({});

  useEffect(() => { setPage(0); }, [sortKey, sortDir]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const from = page * PAGE_SIZE;
      const { data, error, count: cnt } = await supabase
        .from("payout_runs").select("*", { count: "exact" })
        .order(sortKey, { ascending: sortDir === "asc" })
        .range(from, from + PAGE_SIZE - 1);
      if (cancelled) return;
      setLoading(false);
      if (error || !data) return;
      setRows(data);
      setCount(cnt ?? 0);

      // Look up customers we don't have cached yet
      const missing = Array.from(new Set(data.map((p) => p.user_id).filter((u) => !cacheRef.current[u])));
      if (missing.length > 0) {
        const { data: cs } = await supabase.from("customers").select("*").in("user_id", missing);
        if (cs) {
          for (const c of cs) if (c.user_id) cacheRef.current[c.user_id] = c;
          setCustomerMap({ ...cacheRef.current });
        }
      } else {
        setCustomerMap({ ...cacheRef.current });
      }
    })();
    return () => { cancelled = true; };
  }, [page, sortKey, sortDir]);

  const toggleSort = (key: PayoutSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold">Payout Runs</h3>
          <p className="text-xs text-muted-foreground">{count.toLocaleString()} total · page {page + 1} of {Math.max(1, Math.ceil(count / PAGE_SIZE))}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <SortChip label="Date" active={sortKey === "ran_at"} onClick={() => toggleSort("ran_at")} dir={sortKey === "ran_at" ? sortDir : undefined} />
          <SortChip label="Amount" active={sortKey === "amount"} onClick={() => toggleSort("amount")} dir={sortKey === "amount" ? sortDir : undefined} />
        </div>
      </div>
      {loading ? (
        <div className="py-16 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No payouts yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((p) => {
            const c = customerMap[p.user_id];
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
      <Pager page={page} pageSize={PAGE_SIZE} count={count} onChange={setPage} />
    </GlassCard>
  );
}

/* ---------------- Bits ---------------- */

function Pager({ page, pageSize, count, onChange }: { page: number; pageSize: number; count: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (count <= pageSize) return null;
  const from = count === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, count);
  return (
    <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
      <p className="text-[11px] text-muted-foreground">Showing {from}–{to} of {count.toLocaleString()}</p>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onChange(Math.max(0, page - 1))} disabled={page === 0}
          className="p-1.5 rounded-lg glass hover:border-primary/30 disabled:opacity-40 disabled:hover:border-border">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs px-3 py-1.5 rounded-lg glass">{page + 1} / {totalPages}</span>
        <button onClick={() => onChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
          className="p-1.5 rounded-lg glass hover:border-primary/30 disabled:opacity-40 disabled:hover:border-border">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function SortTh({ children, active, dir, onClick }: { children: React.ReactNode; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <th className="text-left font-medium px-3 py-2.5">
      <button onClick={onClick} className={`inline-flex items-center gap-1 hover:text-primary transition ${active ? "text-primary" : ""}`}>
        {children}
        {active ? (dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
      </button>
    </th>
  );
}

function SortChip({ label, active, onClick, dir }: { label: string; active: boolean; onClick: () => void; dir?: SortDir }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
        active ? "bg-primary/15 text-primary border-primary/30" : "glass border-border hover:border-primary/30"
      }`}>
      {label}
      {active && dir ? (dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : null}
    </button>
  );
}

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

function SettingsTab({ onToast }: { onToast: (kind: "ok" | "err", msg: string) => void }) {
  const { settings, update, perWinner } = usePoolSettings();
  const [poolTotal, setPoolTotal] = useState<string>(String(settings.poolTotal));
  const [winners, setWinners] = useState<string>(String(settings.winners));

  useEffect(() => {
    setPoolTotal(String(settings.poolTotal));
    setWinners(String(settings.winners));
  }, [settings.poolTotal, settings.winners]);

  const parsedPool = Number(poolTotal);
  const parsedWinners = Number(winners);
  const valid =
    Number.isFinite(parsedPool) && parsedPool > 0 &&
    Number.isFinite(parsedWinners) && parsedWinners > 0;
  const previewPerWinner = valid ? parsedPool / parsedWinners : 0;
  const dirty = parsedPool !== settings.poolTotal || parsedWinners !== settings.winners;

  const save = () => {
    if (!valid) {
      onToast("err", "Enter valid positive numbers.");
      return;
    }
    update({ poolTotal: parsedPool, winners: Math.floor(parsedWinners) });
    onToast("ok", "Pool settings saved. Site updated.");
  };

  const reset = () => {
    update(DEFAULT_POOL_SETTINGS);
    onToast("ok", "Restored default pool settings.");
  };

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <GlassCard className="lg:col-span-2 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-5 h-5 text-gold" />
          <h2 className="text-lg font-bold">Daily Reward Pool</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Update the daily pool. All payout and winner figures across the site recalculate automatically.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Daily pool total (USDT)</span>
            <input
              type="number" min={1} step={1} value={poolTotal}
              onChange={(e) => setPoolTotal(e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl glass border border-border focus:border-primary outline-none font-mono"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Number of winners</span>
            <input
              type="number" min={1} step={1} value={winners}
              onChange={(e) => setWinners(e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl glass border border-border focus:border-primary outline-none font-mono"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          <button
            onClick={save} disabled={!valid || !dirty}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> Save changes
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass text-sm font-medium hover:border-destructive/30"
          >
            <RefreshCw className="w-4 h-4" /> Reset to default
          </button>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Live preview</h2>
        </div>
        <div className="space-y-3">
          <Stat label="Daily pool" value={valid ? `$${fmt(parsedPool)}` : "—"} />
          <Stat label="Winners / day" value={valid ? fmt(parsedWinners) : "—"} />
          <Stat label="Per winner" value={valid ? `$${fmt(previewPerWinner)}` : "—"} accent />
        </div>
        <p className="text-[11px] text-muted-foreground mt-4">
          Currently saved: <span className="font-mono text-foreground">${settings.poolTotal.toLocaleString()}</span> ÷{" "}
          <span className="font-mono text-foreground">{settings.winners}</span> = <span className="font-mono text-gold">${perWinner.toLocaleString()}</span> per winner.
        </p>
      </GlassCard>

      <GlassCard className="lg:col-span-3 p-6">
        <DepositAddressesSettings onToast={onToast} />
      </GlassCard>

      <GlassCard className="lg:col-span-3 p-6">
        <WhatsAppSettings onToast={onToast} />
      </GlassCard>
    </div>
  );
}

type AddrField = { key: "usdt_trc20_address" | "usdt_bep20_address" | "usdt_erc20_address" | "binance_pay_id"; label: string; placeholder: string; regex: RegExp; help: string };
const ADDR_FIELDS: AddrField[] = [
  { key: "usdt_trc20_address", label: "USDT · TRC20 (Tron)", placeholder: "T...", regex: /^T[a-zA-Z0-9]{33}$/, help: "Starts with T, 34 chars total." },
  { key: "usdt_bep20_address", label: "USDT · BEP20 (BSC)", placeholder: "0x...", regex: /^0x[a-fA-F0-9]{40}$/, help: "0x + 40 hex chars." },
  { key: "usdt_erc20_address", label: "USDT · ERC20 (Ethereum)", placeholder: "0x...", regex: /^0x[a-fA-F0-9]{40}$/, help: "0x + 40 hex chars." },
  { key: "binance_pay_id", label: "Binance Pay ID", placeholder: "123456789", regex: /^[a-zA-Z0-9_-]{3,64}$/, help: "3–64 chars, letters/numbers/_/- only." },
];

function DepositAddressesSettings({ onToast }: { onToast: (kind: "ok" | "err", msg: string) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_settings")
      .select("usdt_trc20_address,usdt_bep20_address,usdt_erc20_address,binance_pay_id")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const init: Record<string, string> = {};
        for (const f of ADDR_FIELDS) init[f.key] = (data?.[f.key] as string | null) ?? "";
        setValues(init);
        setSaved(init);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const fieldErrors = ADDR_FIELDS.map((f) => {
    const v = (values[f.key] ?? "").trim();
    return v.length > 0 && !f.regex.test(v) ? f.key : null;
  }).filter(Boolean) as string[];
  const dirty = ADDR_FIELDS.some((f) => (values[f.key] ?? "").trim() !== (saved[f.key] ?? ""));
  const canSave = !loading && !saving && dirty && fieldErrors.length === 0;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    const patch: Record<string, string | null> = {};
    for (const f of ADDR_FIELDS) {
      const v = (values[f.key] ?? "").trim();
      patch[f.key] = v === "" ? null : v;
    }
    const { error } = await supabase.from("site_settings").update(patch as never).eq("id", 1);
    setSaving(false);
    if (error) { onToast("err", error.message); return; }
    const next: Record<string, string> = {};
    for (const f of ADDR_FIELDS) next[f.key] = patch[f.key] ?? "";
    setSaved(next);
    setValues(next);
    onToast("ok", "Deposit addresses updated.");
  };

  const copy = async (key: string) => {
    const v = (values[key] ?? "").trim();
    if (!v) return;
    await navigator.clipboard.writeText(v);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <Wallet className="w-5 h-5 text-gold" />
        <h2 className="text-lg font-bold">Deposit destination addresses</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Where users send funds when making a deposit. Leave a field empty to hide that network from the user deposit page.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {ADDR_FIELDS.map((f) => {
          const v = values[f.key] ?? "";
          const invalid = v.trim().length > 0 && !f.regex.test(v.trim());
          return (
            <label key={f.key} className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{f.label}</span>
              <div className={`mt-1.5 flex items-center gap-2 px-3 py-2.5 rounded-xl glass border ${invalid ? "border-destructive" : "border-border focus-within:border-primary"}`}>
                <input
                  type="text"
                  placeholder={f.placeholder}
                  value={v}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  disabled={loading}
                  spellCheck={false}
                  autoComplete="off"
                  className="flex-1 bg-transparent outline-none font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => copy(f.key)}
                  disabled={!v.trim()}
                  className="shrink-0 p-1.5 rounded-md hover:bg-primary/10 disabled:opacity-40"
                  aria-label="Copy"
                >
                  {copiedKey === f.key ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className={`text-[11px] mt-1 ${invalid ? "text-destructive" : "text-muted-foreground"}`}>
                {invalid ? `Invalid format. ${f.help}` : f.help}
              </p>
            </label>
          );
        })}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={save}
          disabled={!canSave}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save addresses"}
        </button>
      </div>
    </>
  );
}

function WhatsAppSettings({ onToast }: { onToast: (kind: "ok" | "err", msg: string) => void }) {
  const [number, setNumber] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_settings")
      .select("whatsapp_number")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const v = data?.whatsapp_number ?? "";
        setNumber(v);
        setSaved(v);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const cleaned = number.replace(/[^\d]/g, "");
  const valid = cleaned.length >= 7 && cleaned.length <= 15;
  const dirty = cleaned !== saved;

  const save = async () => {
    if (!valid) { onToast("err", "Enter a valid number (7–15 digits, no +)."); return; }
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ whatsapp_number: cleaned })
      .eq("id", 1);
    setSaving(false);
    if (error) { onToast("err", error.message); return; }
    setSaved(cleaned);
    setNumber(cleaned);
    window.dispatchEvent(new CustomEvent("novatrad:whatsapp-number-changed", { detail: cleaned }));
    onToast("ok", "WhatsApp support number updated.");
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="w-5 h-5 text-success" />
        <h2 className="text-lg font-bold">WhatsApp Support Number</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        The number used by the floating WhatsApp chat button on every page. International format, digits only (no +, no spaces).
      </p>

      <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">WhatsApp number</span>
          <div className="mt-1.5 flex items-center gap-2 px-3 py-2.5 rounded-xl glass border border-border focus-within:border-primary">
            <span className="text-muted-foreground font-mono text-sm">+</span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="14155551234"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              disabled={loading}
              className="flex-1 bg-transparent outline-none font-mono"
            />
          </div>
        </label>
        <button
          onClick={save}
          disabled={!valid || !dirty || saving || loading}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && (
          <a
            href={`https://wa.me/${saved}?text=${encodeURIComponent("Test from AuraTrad.Ai admin")}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass text-sm font-medium hover:border-success/40"
          >
            Test chat
          </a>
        )}
      </div>

      {!loading && (
        <p className="text-[11px] text-muted-foreground mt-3">
          Currently live on the site:{" "}
          <span className="font-mono text-foreground">{saved ? `+${saved}` : "— not set —"}</span>
        </p>
      )}
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl glass">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm font-bold ${accent ? "gradient-text" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
