import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Check, X, Play, Plus } from "lucide-react";
import { GlassCard, Section } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/operations")({
  component: Ops,
  head: () => ({ meta: [{ title: "Operations — Admin" }, { name: "robots", content: "noindex" }] }),
});

type Tab = "deposits" | "withdrawals" | "investments";

function Ops() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("deposits");
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return navigate({ to: "/login" });
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", sess.session.user.id).eq("role", "admin").maybeSingle();
      if (!role) return navigate({ to: "/dashboard" });
      setReady(true);
    })();
  }, [navigate]);

  const load = useCallback(async () => {
    const { data } = await supabase.from(tab).select("*").order("created_at", { ascending: false }).limit(100);
    setRows(data ?? []);
  }, [tab]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  const update = async (id: string, patch: Record<string, unknown>) => {
    setBusy(id);
    const { error } = await (supabase.from(tab) as any).update(patch).eq("id", id);
    if (error) alert(error.message);
    await load(); setBusy(null);
  };

  const creditEarning = async (inv: any) => {
    const amt = prompt(`Credit earning for ${inv.plan_name} (USDT):`);
    if (!amt) return;
    const note = prompt("Note (optional):") ?? "";
    const { error } = await supabase.from("investment_earnings").insert({
      investment_id: inv.id, user_id: inv.user_id, amount: Number(amt), note,
    });
    if (error) alert(error.message); else alert("Earning credited.");
  };

  if (!ready) return <div className="flex justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <Section className="!py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Operations</h1>
        <Link to="/admin" className="text-sm text-primary">← Admin overview</Link>
      </div>

      <div className="flex gap-2 mb-5">
        {(["deposits", "withdrawals", "investments"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${tab === t ? "bg-primary text-primary-foreground glow-primary" : "glass"}`}>{t}</button>
        ))}
      </div>

      <GlassCard>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nothing here yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase tracking-widest">
                <tr className="text-left">
                  <th className="py-2">Created</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Detail</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border/40 align-top">
                    <td className="py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="text-xs font-mono">{r.user_id?.slice(0, 8)}…</td>
                    <td className="font-medium">${Number(r.amount).toLocaleString()}</td>
                    <td className="text-xs">
                      {tab === "deposits" && <>{r.network} · <code>{r.tx_hash?.slice(0, 16)}…</code></>}
                      {tab === "withdrawals" && <>{r.destination_type}: {r.destination}</>}
                      {tab === "investments" && <>{r.service} · {r.plan_name}{r.external_ref ? ` · ref: ${r.external_ref}` : ""}</>}
                    </td>
                    <td><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{r.status}</span></td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {tab === "deposits" && r.status === "pending" && (
                          <>
                            <button disabled={busy === r.id} onClick={() => update(r.id, { status: "approved" })} className="px-2 py-1 rounded bg-success/20 text-success text-xs inline-flex items-center gap-1"><Check className="w-3 h-3" />Approve</button>
                            <button disabled={busy === r.id} onClick={() => update(r.id, { status: "rejected", admin_notes: prompt("Reason?") ?? "" })} className="px-2 py-1 rounded bg-destructive/20 text-destructive text-xs inline-flex items-center gap-1"><X className="w-3 h-3" />Reject</button>
                          </>
                        )}
                        {tab === "withdrawals" && r.status === "pending" && (
                          <>
                            <button disabled={busy === r.id} onClick={() => update(r.id, { status: "paid", admin_notes: prompt("Tx hash / note:") ?? "" })} className="px-2 py-1 rounded bg-success/20 text-success text-xs inline-flex items-center gap-1"><Check className="w-3 h-3" />Mark paid</button>
                            <button disabled={busy === r.id} onClick={() => update(r.id, { status: "rejected", admin_notes: prompt("Reason?") ?? "" })} className="px-2 py-1 rounded bg-destructive/20 text-destructive text-xs inline-flex items-center gap-1"><X className="w-3 h-3" />Reject</button>
                          </>
                        )}
                        {tab === "investments" && (
                          <>
                            {r.status === "pending" && (
                              <button disabled={busy === r.id} onClick={() => update(r.id, { status: "active", external_provider: prompt("External provider:") ?? "", external_ref: prompt("External ref:") ?? "" })} className="px-2 py-1 rounded bg-success/20 text-success text-xs inline-flex items-center gap-1"><Play className="w-3 h-3" />Activate</button>
                            )}
                            {r.status === "active" && (
                              <>
                                <button onClick={() => creditEarning(r)} className="px-2 py-1 rounded bg-gold/20 text-gold text-xs inline-flex items-center gap-1"><Plus className="w-3 h-3" />Credit earning</button>
                                <button disabled={busy === r.id} onClick={() => update(r.id, { status: "completed" })} className="px-2 py-1 rounded bg-muted text-xs">Complete</button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </Section>
  );
}
