import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  keywords: string[];
  reply: string;
  is_fallback: boolean;
  is_active: boolean;
  sort_order: number;
  _dirty?: boolean;
  _new?: boolean;
};

export function BotRepliesPanel() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("support_bot_replies")
      .select("*")
      .order("sort_order", { ascending: true });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const update = (id: string, patch: Partial<Row>) =>
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch, _dirty: true } : r)),
    );

  const addRow = () => {
    const tmp: Row = {
      id: `new-${Date.now()}`,
      keywords: [],
      reply: "",
      is_fallback: false,
      is_active: true,
      sort_order: (rows[rows.length - 1]?.sort_order ?? 0) + 10,
      _dirty: true,
      _new: true,
    };
    setRows((prev) => [...prev, tmp]);
  };

  const save = async (row: Row) => {
    setSavingId(row.id);
    const payload = {
      keywords: row.keywords,
      reply: row.reply,
      is_fallback: row.is_fallback,
      is_active: row.is_active,
      sort_order: row.sort_order,
    };
    if (row._new) {
      const { data } = await supabase
        .from("support_bot_replies")
        .insert(payload)
        .select()
        .single();
      if (data) {
        setRows((prev) => prev.map((r) => (r.id === row.id ? (data as Row) : r)));
      }
    } else {
      await supabase.from("support_bot_replies").update(payload).eq("id", row.id);
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, _dirty: false } : r)),
      );
    }
    setSavingId(null);
  };

  const remove = async (row: Row) => {
    if (!confirm("Delete this auto-reply?")) return;
    if (!row._new) {
      await supabase.from("support_bot_replies").delete().eq("id", row.id);
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  return (
    <div className="glass rounded-2xl mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <Bot className="w-4 h-4 text-primary" />
          Auto-reply presets ({rows.length})
        </span>
        <span className="text-[11px] text-muted-foreground">
          {open ? "Hide" : "Manage"}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground">
                The bot sends an auto-reply when a user's message matches any keyword.
                Mark one row as <em>fallback</em> to use when nothing matches. Empty list = inactive.
              </p>
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-border bg-card/40 p-3 space-y-2"
                >
                  <div className="grid sm:grid-cols-[1fr_90px] gap-2">
                    <input
                      type="text"
                      value={r.keywords.join(", ")}
                      onChange={(e) =>
                        update(r.id, {
                          keywords: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Keywords (comma separated). Leave empty for fallback."
                      className="px-3 py-2 rounded-lg bg-input/50 border border-border focus:border-primary outline-none text-xs"
                    />
                    <input
                      type="number"
                      value={r.sort_order}
                      onChange={(e) =>
                        update(r.id, { sort_order: Number(e.target.value) || 0 })
                      }
                      placeholder="Order"
                      className="px-3 py-2 rounded-lg bg-input/50 border border-border focus:border-primary outline-none text-xs"
                    />
                  </div>
                  <textarea
                    value={r.reply}
                    onChange={(e) => update(r.id, { reply: e.target.value })}
                    rows={3}
                    placeholder="Auto-reply message…"
                    className="w-full px-3 py-2 rounded-lg bg-input/50 border border-border focus:border-primary outline-none text-xs resize-y"
                  />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3 text-[11px]">
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={r.is_active}
                          onChange={(e) =>
                            update(r.id, { is_active: e.target.checked })
                          }
                        />
                        Active
                      </label>
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={r.is_fallback}
                          onChange={(e) =>
                            update(r.id, { is_fallback: e.target.checked })
                          }
                        />
                        Fallback
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => remove(r)}
                        className="text-[11px] px-2.5 py-1.5 rounded-lg glass hover:border-destructive/40 inline-flex items-center gap-1.5 text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                      <button
                        onClick={() => void save(r)}
                        disabled={!r._dirty || !r.reply.trim() || savingId === r.id}
                        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {savingId === r.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addRow}
                className="w-full text-xs px-3 py-2 rounded-lg glass hover:border-primary/40 inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add preset
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
