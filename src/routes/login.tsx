import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Hexagon, Cable, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Sign in — NovaTrad.Ai" }] }),
});

function Login() {
  return <AuthCard mode="login" />;
}

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: form.fullName },
          },
        });
        if (error) throw error;
        if (data.user) {
          const { error: cErr } = await supabase.from("customers").insert({
            user_id: data.user.id,
            full_name: form.fullName,
            email: form.email,
            phone: form.phone || null,
            country: form.country || null,
            binance_uid: form.binanceUid,
            binance_wallet_address: form.binanceWallet || null,
            referred_by: form.referredBy || null,
          });
          if (cErr) throw cErr;
        }
        setSuccess("Account created. Check your email to confirm, then sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
        <h1 className="text-2xl font-bold text-center">{isLogin ? "Welcome back" : "Start your free demo"}</h1>
        <p className="text-sm text-muted-foreground text-center mt-1.5">{isLogin ? "Sign in to your investor dashboard." : "Try NovaTrad.Ai with a $10,000 demo balance — upgrade automatically when you deposit."}</p>

        {!isLogin && (
          <div className="mt-5 rounded-xl border border-success/30 bg-success/5 p-3 flex items-start gap-2.5">
            <Cable className="w-4 h-4 text-success mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">Free demo account.</span> Practice AI trading, mining and staking with a virtual $10,000 balance. Your account becomes a real account automatically once you fund it from your Binance wallet.
            </p>
          </div>
        )}

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          {!isLogin && (
            <input required value={form.fullName} onChange={upd("fullName")} placeholder="Full name" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
          )}
          <input required type="email" value={form.email} onChange={upd("email")} placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
          {!isLogin && (
            <>
              <input value={form.phone} onChange={upd("phone")} placeholder="Phone number" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
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
            {isLogin ? "Sign in" : "Start free demo"}
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
      </div>
    </section>
  );
}
