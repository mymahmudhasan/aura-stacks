import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, Wallet, Search, ShieldCheck, BadgeCheck, Clock, Cable, LogOut, Loader2, Phone, Globe2 } from "lucide-react";
import { GlassCard, Section } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin")({
  component: Admin,
  head: () => ({ meta: [{ title: "Admin — NovaVault" }, { name: "robots", content: "noindex" }] }),
});

type Customer = Tables<"customers">;

function Admin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/admin/login" });
        return;
      }
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sess.session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) {
        await supabase.auth.signOut();
        navigate({ to: "/admin/login" });
        return;
      }
      setAuthorized(true);
      setChecking(false);
      void loadCustomers();
    })();
  }, [navigate]);

  const loadCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (!error && data) setCustomers(data);
  };

  const totals = useMemo(() => ({
    customers: customers.length,
    deposits: customers.reduce((s, c) => s + Number(c.total_deposited ?? 0), 0),
    balances: customers.reduce((s, c) => s + Number(c.balance ?? 0), 0),
    pending: customers.filter((c) => c.status === "pending").length,
  }), [customers]);

  const filtered = customers.filter((c) =>
    !q ||
    [c.full_name, c.email, c.phone, c.binance_uid, c.binance_wallet_address, c.country, c.referred_by]
      .filter(Boolean)
      .some((v) => v!.toLowerCase().includes(q.toLowerCase())),
  );

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!authorized) return null;

  return (
    <Section className="!py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs uppercase tracking-widest text-primary mb-2">
            <ShieldCheck className="w-3 h-3" /> Admin Console
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">NovaVault <span className="gradient-text">Operations</span></h1>
          <p className="text-sm text-muted-foreground mt-1">Live customer database — manage deposits, balances and Binance payouts.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, UID, wallet…"
              className="pl-9 pr-4 py-2.5 w-72 rounded-xl bg-input/50 border border-border focus:border-primary outline-none text-sm"
            />
          </div>
          <button onClick={signOut} className="px-3 py-2.5 rounded-xl glass hover:border-primary/30 text-sm inline-flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<Users />} label="Total Customers" value={String(totals.customers)} trend={`${totals.pending} pending`} />
        <Kpi icon={<Wallet />} label="Total Deposited" value={`$${totals.deposits.toLocaleString()}`} trend="All-time" />
        <Kpi icon={<Wallet />} label="Live Balances" value={`$${totals.balances.toLocaleString()}`} trend="Across all accounts" />
        <Kpi icon={<Cable />} label="Binance Verified" value={String(customers.filter((c) => !!c.binance_uid).length)} trend="UID on file" />
      </div>

      <div className="mt-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg glass flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div>
              <div>
                <h3 className="font-semibold">Customer Database</h3>
                <p className="text-xs text-muted-foreground">Name, email, phone, Binance UID & wallet for manual payouts.</p>
              </div>
            </div>
            <button onClick={loadCustomers} className="text-xs px-3 py-1.5 rounded-lg glass hover:border-primary/30">Refresh</button>
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No customers yet. New sign-ups will appear here automatically.
              <div className="mt-3"><Link to="/register" className="text-primary text-xs">Open registration page →</Link></div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="text-xs uppercase tracking-widest text-muted-foreground">
                    {["Name", "Email", "Phone", "Country", "Binance UID", "Wallet", "Balance", "Deposited", "Status", "Joined"].map((h) => (
                      <th key={h} className="text-left font-medium px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-t border-border/40 hover:bg-white/5">
                      <Td>{c.full_name}</Td>
                      <Td muted>{c.email}</Td>
                      <Td muted><span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone || "—"}</span></Td>
                      <Td muted><span className="inline-flex items-center gap-1"><Globe2 className="w-3 h-3" />{c.country || "—"}</span></Td>
                      <Td mono><span className="inline-flex items-center gap-1.5"><Cable className="w-3 h-3 text-primary" />{c.binance_uid}</span></Td>
                      <Td mono muted className="max-w-[180px] truncate">{c.binance_wallet_address || "—"}</Td>
                      <Td className="font-semibold">${Number(c.balance).toLocaleString()}</Td>
                      <Td>${Number(c.total_deposited).toLocaleString()}</Td>
                      <Td><StatusPill v={c.status} /></Td>
                      <Td muted>{new Date(c.created_at).toLocaleDateString()}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </Section>
  );
}

function Kpi({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary/15 text-primary">{icon}</div>
        <span className="text-xs text-muted-foreground">{trend}</span>
      </div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </GlassCard>
  );
}

function Td({ children, muted, mono, className = "" }: { children: React.ReactNode; muted?: boolean; mono?: boolean; className?: string }) {
  return <td className={`px-3 py-3 align-middle ${muted ? "text-muted-foreground" : ""} ${mono ? "font-mono text-xs" : ""} ${className}`}>{children}</td>;
}

function StatusPill({ v }: { v: string }) {
  const map: Record<string, string> = {
    active: "bg-success/15 text-success",
    pending: "bg-gold/15 text-gold",
    suspended: "bg-destructive/15 text-destructive",
  };
  const Icon = v === "active" ? BadgeCheck : Clock;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium capitalize ${map[v] || "glass"}`}>
      <Icon className="w-3 h-3" /> {v}
    </span>
  );
}
