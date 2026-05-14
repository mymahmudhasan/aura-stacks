import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldAlert, Loader2, ArrowLeft, Loader, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Status =
  | { state: "loading" }
  | { state: "ok" }
  | { state: "needs_verify"; phone: string | null };

export function RequirePhoneVerified({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>({ state: "loading" });

  const load = async () => {
    setStatus({ state: "loading" });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus({ state: "ok" }); // let downstream auth gates handle sign-in
      return;
    }
    const { data } = await supabase
      .from("customers")
      .select("account_type, phone, phone_verified_at")
      .eq("user_id", user.id)
      .maybeSingle();

    // Demo accounts are allowed through. Real accounts must have a verified phone.
    if (!data || data.account_type !== "real" || data.phone_verified_at) {
      setStatus({ state: "ok" });
    } else {
      setStatus({ state: "needs_verify", phone: data.phone ?? user.phone ?? null });
    }
  };

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, []);

  if (status.state === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (status.state === "needs_verify") {
    return <VerifyRequired phone={status.phone} onVerified={load} />;
  }

  return <>{children}</>;
}

function VerifyRequired({ phone, onVerified }: { phone: string | null; onVerified: () => void }) {
  const [code, setCode] = useState("");
  const [number, setNumber] = useState(phone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const e164 = (p: string) => {
    const t = p.replace(/[\s-()]/g, "");
    return t.startsWith("+") ? t : `+${t}`;
  };

  const sendCode = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const p = e164(number);
      if (!/^\+[1-9]\d{6,14}$/.test(p)) throw new Error("Enter a valid international phone number, e.g. +14155552671");
      const { error } = await supabase.auth.updateUser({ phone: p });
      if (error) throw error;
      setSent(true);
      setInfo(`Code sent to ${p}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send code");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const p = e164(number);
      const { error } = await supabase.auth.verifyOtp({ phone: p, token: code.trim(), type: "phone_change" });
      if (error) throw error;
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        await supabase
          .from("customers")
          .update({ phone_verified_at: new Date().toISOString() })
          .eq("user_id", u.user.id);
      }
      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-5 py-16">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 bg-[image:var(--gradient-aurora)]" />
      <div className="relative w-full max-w-md glass-strong rounded-3xl p-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-warning/15 mx-auto mb-3">
          <ShieldAlert className="w-6 h-6 text-warning" />
        </div>
        <h1 className="text-2xl font-bold text-center">Phone verification required</h1>
        <p className="text-sm text-muted-foreground text-center mt-1.5">
          For your account's security, you must verify your phone number before accessing your real-account dashboard.
        </p>

        {!sent ? (
          <div className="mt-6 space-y-3">
            <input
              type="tel"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Phone number (e.g. +14155552671)"
              className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-success">{info}</p>}
            <button
              onClick={sendCode}
              disabled={loading || !number}
              className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send verification code
            </button>
          </div>
        ) : (
          <form onSubmit={verify} className="mt-6 space-y-3">
            <input
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none text-center tracking-[0.5em] font-mono text-lg"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-success">{info}</p>}
            <button
              disabled={loading || code.length !== 6}
              className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Verify & unlock dashboard
            </button>
            <button
              type="button"
              onClick={() => { setSent(false); setCode(""); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Use a different number
            </button>
          </form>
        )}

        <p className="text-[11px] text-center text-muted-foreground mt-6">
          Need help? <Link to="/support" className="text-primary">Contact support</Link>
        </p>
      </div>
    </section>
  );
}
