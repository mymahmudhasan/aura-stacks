import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Hexagon, Cable, Loader2, ShieldCheck, ArrowLeft, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Sign in — NovaTrad.Ai" }] }),
});

function Login() {
  return <AuthCard mode="login" />;
}

type Step = "form" | "verify";
type VerifyMethod = "phone" | "email";

export function AuthCard({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    country: "",
    binanceUid: "",
    binanceWallet: "",
    referredBy: "",
  });
  const [step, setStep] = useState<Step>("form");
  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>("phone");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const normalizedPhone = () => {
    const p = form.phone.replace(/[\s-()]/g, "");
    return p.startsWith("+") ? p : `+${p}`;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
        return;
      }

      // Register flow
      const phone = form.phone ? normalizedPhone() : "";
      if (verifyMethod === "phone" && !/^\+[1-9]\d{6,14}$/.test(phone)) {
        throw new Error("Enter a valid phone number in international format, e.g. +14155552671");
      }

      // Sign up. Supabase emails a 6-digit OTP token (alongside the magic link)
      // when email confirmations are enabled. We verify with type: "signup".
      const signUpPayload: Parameters<typeof supabase.auth.signUp>[0] =
        verifyMethod === "phone"
          ? {
              phone,
              password: form.password,
              options: { data: { full_name: form.fullName, email: form.email } },
            }
          : {
              email: form.email,
              password: form.password,
              options: {
                emailRedirectTo: `${window.location.origin}/dashboard`,
                data: { full_name: form.fullName },
              },
            };

      const { data, error } = await supabase.auth.signUp(signUpPayload);
      if (error) throw error;

      if (data.user) {
        const { error: cErr } = await supabase.from("customers").insert({
          user_id: data.user.id,
          full_name: form.fullName,
          email: form.email,
          phone: phone || null,
          country: form.country || null,
          binance_uid: form.binanceUid,
          binance_wallet_address: form.binanceWallet || null,
          referred_by: form.referredBy || null,
        });
        if (cErr) throw cErr;
      }

      if (verifyMethod === "phone") {
        setSuccess(`We sent a 6-digit SMS code to ${phone}.`);
      } else {
        setSuccess(`We sent a 6-digit code to ${form.email}. Check your inbox (and spam folder).`);
      }
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (verifyMethod === "phone") {
        const phone = normalizedPhone();
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: otp.trim(),
          type: "sms",
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.verifyOtp({
          email: form.email,
          token: otp.trim(),
          type: "signup",
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
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (verifyMethod === "phone") {
        const { error } = await supabase.auth.resend({
          type: "sms",
          phone: normalizedPhone(),
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: form.email,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
      }
      setSuccess("A new code has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-5 py-16">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 bg-[image:var(--gradient-aurora)]" />
      <div className="relative w-full max-w-md glass-strong rounded-3xl p-8 glow-primary">
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-6">
          <Hexagon className="w-8 h-8 text-primary fill-primary/20" strokeWidth={1.5} />
          <span className="text-lg font-bold">Nova<span className="gradient-text">Vault</span></span>
        </Link>

        {step === "verify" ? (
          <>
            <button
              onClick={() => setStep("form")}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-center">{verifyMethod === "phone" ? "Verify your phone" : "Verify your email"}</h1>
            <p className="text-sm text-muted-foreground text-center mt-1.5">
              Enter the 6-digit code we sent to{" "}
              <span className="text-foreground font-medium">
                {verifyMethod === "phone" ? normalizedPhone() : form.email}
              </span>.
            </p>

            <form className="mt-6 space-y-3" onSubmit={onVerify}>
              <input
                required
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none text-center tracking-[0.5em] font-mono text-lg"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-success">{success}</p>}
              <button
                disabled={loading || otp.length !== 6}
                className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify & continue
              </button>
            </form>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Didn't get it?{" "}
              <button onClick={resendOtp} disabled={loading} className="text-primary disabled:opacity-60">
                Resend code
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center">{isLogin ? "Welcome back" : "Create your account"}</h1>
            <p className="text-sm text-muted-foreground text-center mt-1.5">
              {isLogin
                ? "Sign in to your investor dashboard."
                : "Step 1 of 2 — choose how you'd like to verify your account."}
            </p>

            {!isLogin && (
              <>
                <div className="mt-5 grid grid-cols-2 gap-2 p-1 rounded-xl bg-input/40 border border-border">
                  <button
                    type="button"
                    onClick={() => setVerifyMethod("phone")}
                    className={`px-3 py-2 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-2 transition ${
                      verifyMethod === "phone" ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" /> Phone (SMS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyMethod("email")}
                    className={`px-3 py-2 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-2 transition ${
                      verifyMethod === "email" ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email code
                  </button>
                </div>
                <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-2.5">
                  <Cable className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-foreground font-medium">
                      {verifyMethod === "phone" ? "Phone verification" : "Email verification"} required.
                    </span>{" "}
                    A 6-digit code will be sent by {verifyMethod === "phone" ? "SMS to your phone" : "email to your inbox"} to confirm it's really you.
                  </p>
                </div>
              </>
            )}

            <form className="mt-5 space-y-3" onSubmit={onSubmit}>
              {!isLogin && (
                <input required value={form.fullName} onChange={upd("fullName")} placeholder="Full name" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
              )}
              <input required type="email" value={form.email} onChange={upd("email")} placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
              {!isLogin && (
                <>
                  <input
                    required={verifyMethod === "phone"}
                    type="tel"
                    value={form.phone}
                    onChange={upd("phone")}
                    placeholder={verifyMethod === "phone" ? "Phone number (e.g. +14155552671)" : "Phone number (optional)"}
                    className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none"
                  />
                  <input value={form.country} onChange={upd("country")} placeholder="Country" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
                </>
              )}
              <input required type="password" value={form.password} onChange={upd("password")} placeholder="Password (min 6 chars)" minLength={6} className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
              {!isLogin && (
                <input value={form.referredBy} onChange={upd("referredBy")} placeholder="Referral code (optional)" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-success">{success}</p>}
              <button disabled={loading} className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLogin ? "Sign in" : "Send verification code"}
              </button>
            </form>
            {!isLogin && (
              <p className="text-[11px] text-center text-muted-foreground mt-3">
                Don't have a Binance account? <a href="https://accounts.binance.com/register" target="_blank" rel="noopener noreferrer" className="text-primary">Create one →</a>
              </p>
            )}
            <p className="text-sm text-center text-muted-foreground mt-5">
              {isLogin ? <>New here? <Link to="/register" className="text-primary">Create an account</Link></> : <>Already a member? <Link to="/login" className="text-primary">Sign in</Link></>}
            </p>
            {isLogin && (
              <p className="text-[11px] text-center text-muted-foreground mt-3">
                <Link to="/admin/login" className="text-primary/80 hover:text-primary">Admin sign in →</Link>
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
