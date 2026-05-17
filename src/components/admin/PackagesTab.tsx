import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Save, X } from "lucide-react";
import { GlassCard } from "@/components/ui-bits";
import {
  adminListPlans,
  createPlan,
  updatePlan,
  deletePlan,
  reorderPlans,
} from "@/lib/plans.functions";

type Service = "ai_trading" | "mining" | "staking";

type Plan = {
  id: string;
  service: Service;
  name: string;
  min_amount: number | string;
  max_amount: number | string | null;
  daily_rate_pct: number | string | null;
  apy_pct: number | string | null;
  duration_days: number | null;
  total_roi_pct: number | string | null;
  flex: string | null;
  badge: string | null;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
};

type Draft = Partial<Plan> & { service: Service };

const SERVICES: { id: Service; label: string }[] = [
  { id: "ai_trading", label: "AI Trading" },
  { id: "mining", label: "Mining" },
  { id: "staking", label: "Staking" },
];

const n = (v: unknown) => (v == null || v === "" ? null : Number(v));

export function PackagesTab({ onToast }: { onToast: (k: "ok" | "err", m: string) => void }) {
  const fetchPlans = useServerFn(adminListPlans);
  const fnCreate = useServerFn(createPlan);
  const fnUpdate = useServerFn(updatePlan);
  const fnDelete = useServerFn(deletePlan);
  const fnReorder = useServerFn(reorderPlans);

  const [service, setService] = useState<Service>("ai_trading");
  const [rows, setRows] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPlans();
      setRows(data as unknown as Plan[]);
    } catch (e) {
      onToast("err", e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [fetchPlans, onToast]);

  useEffect(() => { void load(); }, [load]);

  const filtered = rows.filter((r) => r.service === service);

  const move = async (idx: number, dir: -1 | 1) => {
    const next = [...filtered];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    try {
      await fnReorder({ data: { ids: next.map((p) => p.id) } });
      await load();
    } catch (e) {
      onToast("err", e instanceof Error ? e.message : "Reorder failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this package? This cannot be undone.")) return;
    try {
      await fnDelete({ data: { id } });
      onToast("ok", "Package deleted");
      await load();
    } catch (e) {
      onToast("err", e instanceof Error ? e.message : "Delete failed");
    }
  };

  const toggleActive = async (p: Plan) => {
    try {
      await fnUpdate({ data: { id: p.id, patch: { is_active: !p.is_active } } });
      await load();
    } catch (e) {
      onToast("err", e instanceof Error ? e.message : "Update failed");
    }
  };

  const startCreate = () => setEditing({
    service, name: "", min_amount: 100, is_popular: false, is_active: true, sort_order: filtered.length + 1,
  });
  const startEdit = (p: Plan) => setEditing({ ...p });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        service: editing.service,
        name: String(editing.name ?? "").trim(),
        min_amount: Number(editing.min_amount ?? 0),
        max_amount: n(editing.max_amount),
        daily_rate_pct: n(editing.daily_rate_pct),
        apy_pct: n(editing.apy_pct),
        duration_days: editing.duration_days == null || (editing.duration_days as unknown) === "" ? null : Number(editing.duration_days),
        total_roi_pct: n(editing.total_roi_pct),
        flex: editing.flex || null,
        badge: editing.badge || null,
        is_popular: !!editing.is_popular,
        is_active: editing.is_active ?? true,
        sort_order: Number(editing.sort_order ?? 0),
      };
      if ((editing as Plan).id) {
        await fnUpdate({ data: { id: (editing as Plan).id, patch: payload } });
        onToast("ok", "Package updated");
      } else {
        await fnCreate({ data: payload });
        onToast("ok", "Package created");
      }
      setEditing(null);
      await load();
    } catch (e) {
      onToast("err", e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1.5">
          {SERVICES.map((s) => (
            <button key={s.id} onClick={() => setService(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                service === s.id ? "bg-primary text-primary-foreground border-primary" : "glass border-border hover:border-primary/30"
              }`}>{s.label}</button>
          ))}
        </div>
        <button onClick={startCreate} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold">
          <Plus className="w-3.5 h-3.5" /> Add package
        </button>
      </div>

      {loading && <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-10">No packages yet for {SERVICES.find(s => s.id === service)?.label}. Click "Add package" to create one.</p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-2 py-2">Name</th>
                <th className="text-left px-2 py-2">Range</th>
                <th className="text-left px-2 py-2">Rate</th>
                <th className="text-left px-2 py-2">Duration</th>
                <th className="text-left px-2 py-2">Badge</th>
                <th className="text-left px-2 py-2">Active</th>
                <th className="text-right px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr key={p.id} className="border-t border-border/40">
                  <td className="px-2 py-2.5">
                    <div className="font-medium">{p.name}</div>
                    {p.is_popular && <span className="text-[10px] text-gold uppercase tracking-wider">Popular</span>}
                  </td>
                  <td className="px-2 py-2.5">${Number(p.min_amount).toLocaleString()}{p.max_amount ? ` – $${Number(p.max_amount).toLocaleString()}` : ""}</td>
                  <td className="px-2 py-2.5">
                    {p.daily_rate_pct != null && <span>{p.daily_rate_pct}% /day</span>}
                    {p.apy_pct != null && <span>{p.apy_pct}% APY</span>}
                  </td>
                  <td className="px-2 py-2.5">{p.duration_days ? `${p.duration_days}d` : "—"}</td>
                  <td className="px-2 py-2.5 text-xs text-muted-foreground">{p.badge || p.flex || "—"}</td>
                  <td className="px-2 py-2.5">
                    <button onClick={() => toggleActive(p)} className={`px-2 py-1 rounded-md text-[10px] font-medium ${p.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {p.is_active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1.5 rounded glass disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => move(idx, 1)} disabled={idx === filtered.length - 1} className="p-1.5 rounded glass disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => startEdit(p)} className="p-1.5 rounded glass hover:border-primary/30"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(p.id)} className="p-1.5 rounded glass hover:border-destructive/40 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => !saving && setEditing(null)}>
          <div className="glass-strong rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{(editing as Plan).id ? "Edit package" : "New package"}</h3>
              <button onClick={() => setEditing(null)} disabled={saving} className="p-1.5 rounded glass"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Service">
                <select value={editing.service} onChange={(e) => setEditing({ ...editing, service: e.target.value as Service })}
                  className="w-full glass rounded-lg px-3 py-2 text-sm">
                  {SERVICES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Name">
                <input value={String(editing.name ?? "")} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full glass rounded-lg px-3 py-2 text-sm" placeholder="Starter" />
              </Field>
              <Field label="Min amount (USDT)">
                <input type="number" value={String(editing.min_amount ?? "")} onChange={(e) => setEditing({ ...editing, min_amount: e.target.value })}
                  className="w-full glass rounded-lg px-3 py-2 text-sm" />
              </Field>
              <Field label="Max amount (USDT)">
                <input type="number" value={editing.max_amount == null ? "" : String(editing.max_amount)} onChange={(e) => setEditing({ ...editing, max_amount: e.target.value })}
                  className="w-full glass rounded-lg px-3 py-2 text-sm" placeholder="Optional" />
              </Field>
              <Field label="Daily rate %">
                <input type="number" step="0.1" value={editing.daily_rate_pct == null ? "" : String(editing.daily_rate_pct)} onChange={(e) => setEditing({ ...editing, daily_rate_pct: e.target.value })}
                  className="w-full glass rounded-lg px-3 py-2 text-sm" placeholder="e.g. 1.5" />
              </Field>
              <Field label="APY %">
                <input type="number" step="0.1" value={editing.apy_pct == null ? "" : String(editing.apy_pct)} onChange={(e) => setEditing({ ...editing, apy_pct: e.target.value })}
                  className="w-full glass rounded-lg px-3 py-2 text-sm" placeholder="Staking only" />
              </Field>
              <Field label="Duration (days)">
                <input type="number" value={editing.duration_days == null ? "" : String(editing.duration_days)} onChange={(e) => setEditing({ ...editing, duration_days: e.target.value === "" ? null : Number(e.target.value) })}
                  className="w-full glass rounded-lg px-3 py-2 text-sm" />
              </Field>
              <Field label="Total ROI %">
                <input type="number" step="0.1" value={editing.total_roi_pct == null ? "" : String(editing.total_roi_pct)} onChange={(e) => setEditing({ ...editing, total_roi_pct: e.target.value })}
                  className="w-full glass rounded-lg px-3 py-2 text-sm" placeholder="Auto-display label" />
              </Field>
              <Field label="Flex (Flexible/Fixed)">
                <input value={editing.flex ?? ""} onChange={(e) => setEditing({ ...editing, flex: e.target.value })}
                  className="w-full glass rounded-lg px-3 py-2 text-sm" placeholder="Staking only" />
              </Field>
              <Field label="Badge">
                <input value={editing.badge ?? ""} onChange={(e) => setEditing({ ...editing, badge: e.target.value })}
                  className="w-full glass rounded-lg px-3 py-2 text-sm" placeholder='e.g. "Best APY"' />
              </Field>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!editing.is_popular} onChange={(e) => setEditing({ ...editing, is_popular: e.target.checked })} />
                Highlight as popular
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                Visible to users
              </label>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditing(null)} disabled={saving} className="flex-1 glass rounded-xl py-2.5 text-sm">Cancel</button>
              <button onClick={save} disabled={saving || !editing.name}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold bg-primary text-primary-foreground glow-primary disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
