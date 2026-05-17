import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, User, Phone, Globe, Wallet, Coins, Hash, CheckCircle2, ShieldCheck } from "lucide-react";
import { GlassCard, Section } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile } from "@/lib/wallet.functions";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Account Settings — AuraTrad.Ai" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
});

type Profile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  binance_uid: string | null;
  binance_wallet_address: string | null;
  preferred_coin: string | null;
  account_type: string | null;
  status: string | null;
};

const COINS = ["USDT", "BTC", "ETH", "BNB"] as const;

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [p, setP] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    country: "",
    binance_uid: "",
    binance_wallet_address: "",
    preferred_coin: "USDT" as (typeof COINS)[number],
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = (await getMyProfile()) as Profile | null;
      setP(data);
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          country: data.country ?? "",
          binance_uid: data.binance_uid ?? "",
          binance_wallet_address: data.binance_wallet_address ?? "",
          preferred_coin: (COINS.includes((data.preferred_coin ?? "USDT") as (typeof COINS)[number])
            ? (data.preferred_coin as (typeof COINS)[number])
            : "USDT"),
        });
      }
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await updateMyProfile({ data: form });
      setMsg({ ok: true, text: "Profile updated successfully." });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Failed to save" });
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Section className="!py-10 max-w-4xl">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)]">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Account Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and payout details.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <GlassCard>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Email</p>
          <p className="text-sm font-mono mt-1 truncate">{p?.email ?? "—"}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Account Type</p>
          <p className="text-sm font-bold mt-1 capitalize">{p?.account_type ?? "demo"}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Status</p>
          <p className="text-sm font-bold mt-1 capitalize text-success inline-flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> {p?.status ?? "active"}
          </p>
        </GlassCard>
      </div>

      <GlassCard>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <h3 className="text-sm font-bold mb-3 inline-flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Personal Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" maxLength={120} value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Jane Doe" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="phone" className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</Label>
                <Input id="phone" maxLength={32} value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 555 123 4567" className="mt-1.5" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="country" className="inline-flex items-center gap-1"><Globe className="w-3 h-3" /> Country</Label>
                <Input id="country" maxLength={80} value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  placeholder="United States" className="mt-1.5" />
              </div>
            </div>
          </div>

          <div className="border-t border-border/40 pt-5">
            <h3 className="text-sm font-bold mb-1 inline-flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" /> Payout Details
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Your Binance UID is used to send manual withdrawals. Make sure it's correct — payouts can't be reversed.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="binance_uid" className="inline-flex items-center gap-1"><Hash className="w-3 h-3" /> Binance UID</Label>
                <Input id="binance_uid" maxLength={64} value={form.binance_uid}
                  onChange={(e) => setForm((f) => ({ ...f, binance_uid: e.target.value }))}
                  placeholder="284910321" className="mt-1.5 font-mono" />
              </div>
              <div>
                <Label htmlFor="wallet">USDT wallet address (optional)</Label>
                <Input id="wallet" maxLength={120} value={form.binance_wallet_address}
                  onChange={(e) => setForm((f) => ({ ...f, binance_wallet_address: e.target.value }))}
                  placeholder="TRX..." className="mt-1.5 font-mono" />
              </div>
              <div className="sm:col-span-2">
                <Label className="inline-flex items-center gap-1"><Coins className="w-3 h-3" /> Preferred payout coin</Label>
                <div className="grid grid-cols-4 gap-2 mt-1.5">
                  {COINS.map((c) => (
                    <button key={c} type="button"
                      onClick={() => setForm((f) => ({ ...f, preferred_coin: c }))}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition ${form.preferred_coin === c ? "bg-primary text-primary-foreground glow-primary" : "glass hover:bg-primary/10"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            {msg && (
              <p className={`text-sm ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>
            )}
            <button type="submit" disabled={saving}
              className="ml-auto rounded-xl px-6 py-3 text-sm font-bold bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold disabled:opacity-60 inline-flex items-center gap-2 hover:opacity-90 transition">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Save changes
            </button>
          </div>
        </form>
      </GlassCard>
    </Section>
  );
}
