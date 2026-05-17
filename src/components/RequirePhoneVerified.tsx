import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldAlert, Loader2, ArrowLeft, ShieldCheck, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Method = "phone" | "email";
type Status =
  | { state: "loading" }
  | { state: "ok" }
  | { state: "needs_verify"; phone: string | null; email: string | null };

export function RequirePhoneVerified({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>({ state: "loading" });

  const load = async (showLoader = false) => {
    if (showLoader) setStatus({ state: "loading" });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus({ state: "ok" });
      return;
    }
    const { data } = await supabase
      .from("customers")
      .select("account_type, phone, email, phone_verified_at, email_verified_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const verified = !!(data?.phone_verified_at || data?.email_verified_at);
    if (!data || data.account_type !== "real" || verified) {
      setStatus({ state: "ok" });
    } else {
      setStatus({
        state: "needs_verify",
        phone: data.phone ?? user.phone ?? null,
        email: data.email ?? user.email ?? null,
      });
    }
  };

  useEffect(() => {
    load(true);
    // Only re-check on actual sign-in/out events, NOT token refresh (which fires often)
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        load(false);
      }
    });
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
    return <VerifyRequired defaultPhone={status.phone} defaultEmail={status.email} onVerified={load} />;
  }

  return <>{children}</>;
}

function VerifyRequired({
  defaultPhone,
  defaultEmail,
  onVerified,
}: {
  defaultPhone: string | null;
  defaultEmail: string | null;
  onVerified: () => void;
}) {
  const [method, setMethod] = useState<Method>(defaultEmail ? "email" : "phone");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const e164 = (p: string) => {
    const t = p.replace(/[\s-()]/g, "");
    return t.startsWith("+") ? t : `+${t}`;
  };

  const switchMethod = (m: Method) => {
    setMethod(m);
    setSent(false);
    setCode("");
    setError(null);
    setInfo(null);
  };

  const sendCode = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (method === "phone") {
        const p = e164(phone);
        if (!/^\+[1-9]\d{6,14}$/.test(p)) throw new Error("Enter a valid international phone, e.g. +14155552671");
        const { error } = await supabase.auth.updateUser({ phone: p });
        if (error) throw error;
        setInfo(`SMS code sent to ${p}.`);
      } else {
        if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address");
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: typeof window !== "undefined" ? window.location.href : undefined,
          },
        });
        if (error) throw error;
        setInfo(`Verification link sent to ${email}. Open it on this device to unlock your dashboard.`);
      }
      setSent(true);
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
      if (method === "phone") {
        const p = e164(phone);
        const { error } = await supabase.auth.verifyOtp({
          phone: p,
          token: code.trim(),
          type: "phone_change",
        });
        if (error) throw error;
        const { data: u } = await supabase.auth.getUser();
        if (u.user) {
          await supabase
            .from("customers")
            .update({ phone_verified_at: new Date().toISOString() })
            .eq("user_id", u.user.id);
        }
      } else {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: code.trim(),
          type: "email",
        });
        if (error) throw error;
        const { data: u } = await supabase.auth.getUser();
        if (u.user) {
          await supabase
            .from("customers")
            .update({ email_verified_at: new Date().toISOString() })
            .eq("user_id", u.user.id);
        }
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
        <h1 className="text-2xl font-bold text-center">Verification required</h1>
        <p className="text-sm text-muted-foreground text-center mt-1.5">
          For your account's security, verify your identity to access your real-account dashboard.
        </p>

        {/* Method tabs */}
        <div className="mt-5 grid grid-cols-2 gap-2 p-1 rounded-xl bg-input/40 border border-border">
          <button
            onClick={() => switchMethod("phone")}
            className={`px-3 py-2 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-2 transition ${
              method === "phone" ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone className="w-3.5 h-3.5" /> Phone (SMS)
          </button>
          <button
            onClick={() => switchMethod("email")}
            className={`px-3 py-2 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-2 transition ${
              method === "email" ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Email code
          </button>
        </div>

        {!sent ? (
          <div className="mt-5 space-y-3">
            {method === "phone" ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number (e.g. +14155552671)"
                className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none"
              />
            ) : (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none"
              />
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-success">{info}</p>}
            <button
              onClick={sendCode}
              disabled={loading || (method === "phone" ? !phone : !email)}
              className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send verification code
            </button>
          </div>
        ) : method === "email" ? (
          <div className="mt-5 space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              We sent a verification link to{" "}
              <span className="text-foreground font-medium">{email}</span>. Open
              your inbox and tap the link on this device to unlock your dashboard.
            </p>
            {info && <p className="text-sm text-success">{info}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border text-foreground font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Resend link
            </button>
            <button
              type="button"
              onClick={() => { setSent(false); setCode(""); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={verify} className="mt-5 space-y-3">
            <p className="text-xs text-center text-muted-foreground">
              Code sent to{" "}
              <span className="text-foreground font-medium">{e164(phone)}</span>
            </p>
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
