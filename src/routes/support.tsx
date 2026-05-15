import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LifeBuoy, Send, Search, CheckCircle2, Loader2, Clock, AlertCircle, MessageSquare, Copy, Check } from "lucide-react";
import { GlassCard, PageHero, Section } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/support")({
  component: Support,
  head: () => ({
    meta: [
      { title: "Support — AuraTrad.Ai" },
      { name: "description", content: "Open a support ticket and track its status. AuraTrad.Ai support replies within 24 hours." },
    ],
  }),
});

const categories = [
  { value: "general", label: "General question" },
  { value: "deposit", label: "Deposit issue" },
  { value: "withdrawal", label: "Withdrawal / Binance payout" },
  { value: "ai_trading", label: "AI Trading" },
  { value: "mining", label: "Mining" },
  { value: "staking", label: "Staking" },
  { value: "account", label: "Account / KYC" },
  { value: "bug", label: "Bug report" },
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

type LookupResult = {
  ticket_number: string;
  subject: string;
  category: string;
  status: "open" | "in_progress" | "awaiting_customer" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

function Support() {
  // Submit form state
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    binance_uid: "",
    category: "general",
    priority: "normal",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [created, setCreated] = useState<{ ticket_number: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Tracker state
  const [lookup, setLookup] = useState({ ticket_number: "", email: "" });
  const [searching, setSearching] = useState(false);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    setSubmitting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const { data, error } = await supabase
        .from("tickets")
        .insert({
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          binance_uid: form.binance_uid.trim() || null,
          category: form.category,
          priority: form.priority as "low" | "normal" | "high" | "urgent",
          subject: form.subject.trim(),
          message: form.message.trim(),
          user_id: sess.session?.user.id ?? null,
        })
        .select("ticket_number, email")
        .single();
      if (error) throw error;
      setCreated(data);
      setForm({ full_name: "", email: "", binance_uid: "", category: "general", priority: "normal", subject: "", message: "" });
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : "Could not submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const onLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupErr(null);
    setResult(null);
    setSearching(true);
    try {
      const { data, error } = await supabase.rpc("lookup_ticket", {
        _ticket_number: lookup.ticket_number.trim().toUpperCase(),
        _email: lookup.email.trim().toLowerCase(),
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setLookupErr("No ticket found. Check the ticket number and email.");
      } else {
        setResult(row as LookupResult);
      }
    } catch (err) {
      setLookupErr(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setSearching(false);
    }
  };

  const copyTicket = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(created.ticket_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <PageHero
        eyebrow="Support"
        title={<>Open a ticket. <span className="gradient-text">Track it live.</span></>}
        subtitle="Tell us what's going on — our team typically responds within 24 hours. You'll get a confirmation email and a ticket number to track status anytime."
      />

      <Section>
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Submit form */}
          <div className="lg:col-span-3">
            <GlassCard>
              {created ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-2xl bg-success/15 text-success mx-auto flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-semibold">Ticket submitted</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">A confirmation email is on its way to <span className="text-foreground">{created.email}</span>.</p>
                  <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl glass">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">Ticket #</span>
                    <span className="font-mono font-semibold">{created.ticket_number}</span>
                    <button onClick={copyTicket} className="ml-1 p-1 rounded-md hover:bg-white/10 transition">
                      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">Save this number — you'll need it together with your email to check status below.</p>
                  <button onClick={() => setCreated(null)} className="mt-5 text-sm text-primary hover:underline">Open another ticket</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center"><LifeBuoy className="w-4 h-4" /></div>
                    <div>
                      <h3 className="font-semibold">New support ticket</h3>
                      <p className="text-xs text-muted-foreground">All fields marked * are required.</p>
                    </div>
                  </div>

                  <form className="space-y-3" onSubmit={onSubmit}>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Full name *">
                        <input required value={form.full_name} onChange={upd("full_name")} className={inputCls} placeholder="Your name" />
                      </Field>
                      <Field label="Email *">
                        <input required type="email" value={form.email} onChange={upd("email")} className={inputCls} placeholder="you@example.com" />
                      </Field>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Binance UID (optional)">
                        <input value={form.binance_uid} onChange={upd("binance_uid")} className={`${inputCls} font-mono text-sm`} placeholder="123456789" />
                      </Field>
                      <Field label="Category *">
                        <select required value={form.category} onChange={upd("category")} className={inputCls}>
                          {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </Field>
                    </div>

                    <Field label="Priority">
                      <div className="grid grid-cols-4 gap-2">
                        {priorities.map((p) => (
                          <button
                            type="button"
                            key={p.value}
                            onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                            className={`px-3 py-2 rounded-lg text-xs border transition ${
                              form.priority === p.value
                                ? "bg-primary/15 border-primary/50 text-primary"
                                : "bg-input/40 border-border hover:border-primary/30"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <Field label="Subject *">
                      <input required maxLength={120} value={form.subject} onChange={upd("subject")} className={inputCls} placeholder="Short summary" />
                    </Field>

                    <Field label="Describe your issue *">
                      <textarea required rows={6} maxLength={4000} value={form.message} onChange={upd("message")} className={`${inputCls} resize-none`} placeholder="Include transaction IDs, screenshots links, and steps you've already tried." />
                    </Field>

                    {submitErr && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                        <p className="text-xs text-destructive">{submitErr}</p>
                      </div>
                    )}

                    <button disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary disabled:opacity-60">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {submitting ? "Submitting…" : "Submit ticket"}
                    </button>
                  </form>
                </>
              )}
            </GlassCard>
          </div>

          {/* Tracker + tips */}
          <div className="lg:col-span-2 space-y-5">
            <GlassCard>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center"><Search className="w-4 h-4" /></div>
                <div>
                  <h3 className="font-semibold">Track ticket status</h3>
                  <p className="text-xs text-muted-foreground">Enter your ticket # and email.</p>
                </div>
              </div>
              <form className="space-y-3" onSubmit={onLookup}>
                <input
                  required
                  value={lookup.ticket_number}
                  onChange={(e) => setLookup((l) => ({ ...l, ticket_number: e.target.value }))}
                  placeholder="NV-1042"
                  className={`${inputCls} font-mono`}
                />
                <input
                  required
                  type="email"
                  value={lookup.email}
                  onChange={(e) => setLookup((l) => ({ ...l, email: e.target.value }))}
                  placeholder="Email used on the ticket"
                  className={inputCls}
                />
                <button disabled={searching} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass hover:border-primary/30 text-sm disabled:opacity-60">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Check status
                </button>
              </form>

              {lookupErr && <p className="text-xs text-destructive mt-3">{lookupErr}</p>}

              {result && (
                <div className="mt-5 p-4 rounded-xl bg-input/30 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">{result.ticket_number}</span>
                    <StatusPill status={result.status} />
                  </div>
                  <p className="text-sm font-medium">{result.subject}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div><span className="block text-[10px] uppercase tracking-widest">Category</span>{result.category}</div>
                    <div><span className="block text-[10px] uppercase tracking-widest">Priority</span><span className="capitalize">{result.priority}</span></div>
                    <div><span className="block text-[10px] uppercase tracking-widest">Opened</span>{new Date(result.created_at).toLocaleDateString()}</div>
                    <div><span className="block text-[10px] uppercase tracking-widest">Updated</span>{new Date(result.updated_at).toLocaleDateString()}</div>
                  </div>
                  <Timeline status={result.status} />
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center"><MessageSquare className="w-4 h-4" /></div>
                <div>
                  <h3 className="font-semibold">Faster help</h3>
                  <p className="text-xs text-muted-foreground">Before you wait, try these.</p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Check the <Link to="/faq" className="text-primary hover:underline">FAQ</Link> for common answers.</li>
                <li>• For withdrawal issues, double-check your <span className="text-foreground">Binance UID</span> on file.</li>
                <li>• Email: <span className="text-foreground">support@novavault.io</span></li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </Section>
    </>
  );
}

const inputCls = "w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ status }: { status: LookupResult["status"] }) {
  const map: Record<LookupResult["status"], { cls: string; label: string }> = {
    open: { cls: "bg-primary/15 text-primary", label: "Open" },
    in_progress: { cls: "bg-gold/15 text-gold", label: "In progress" },
    awaiting_customer: { cls: "bg-gold/15 text-gold", label: "Awaiting you" },
    resolved: { cls: "bg-success/15 text-success", label: "Resolved" },
    closed: { cls: "bg-muted/30 text-muted-foreground", label: "Closed" },
  };
  const { cls, label } = map[status];
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${cls}`}><Clock className="w-3 h-3" />{label}</span>;
}

function Timeline({ status }: { status: LookupResult["status"] }) {
  const steps: LookupResult["status"][] = ["open", "in_progress", "resolved"];
  const reached = (s: LookupResult["status"]) => {
    if (status === "closed" || status === "resolved") return true;
    if (s === "open") return true;
    if (s === "in_progress") return status === "in_progress" || status === "awaiting_customer";
    return false;
  };
  return (
    <div className="flex items-center gap-2 pt-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2 flex-1">
          <div className={`w-2.5 h-2.5 rounded-full ${reached(s) ? "bg-primary" : "bg-border"}`} />
          {i < steps.length - 1 && <div className={`flex-1 h-px ${reached(steps[i + 1]) ? "bg-primary" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}
