import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Hexagon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Sign in — AuraTrad.Ai" }] }),
});

function Login() {
  return <AuthCard mode="login" />;
}

const friendlyError = (msg: string) => {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Wrong email or password. Try again or reset your password.";
  if (m.includes("user already registered") || m.includes("user_already_exists"))
    return "An account with that email already exists. Try signing in instead.";
  if (m.includes("email not confirmed")) return "Please confirm your email — check your inbox for the verification link.";
  if (m.includes("password should be at least")) return msg;
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts — please wait a minute and try again.";
  if (m.includes("duplicate key") && m.includes("email")) return "An account with that email already exists.";
  return msg;
};

export function AuthCard({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    country: "",
    binanceWallet: "",
    referredBy: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const normalizedPhone = () => {
    const p = form.phone.replace(/[\s-()]/g, "");
    return p.startsWith("+") ? p : p ? `+${p}` : "";
  };

  const routeAfterAuth = async (userId?: string) => {
    let uid = userId;
    if (!uid) {
      const { data } = await supabase.auth.getSession();
      uid = data.session?.user.id;
    }
    if (uid) {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      if (role) {
        navigate({ to: "/admin" });
        return;
      }
    }
    navigate({ to: "/dashboard" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const cleanEmail = form.email.trim().toLowerCase();
    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: form.password });
        if (error) throw error;
        await routeAfterAuth(data.user?.id);
        return;
      }

      // Register
      if (!form.fullName.trim()) throw new Error("Please enter your full name.");
      if (form.password.length < 6) throw new Error("Password must be at least 6 characters.");
      if (form.password !== form.confirmPassword) throw new Error("Passwords don't match.");

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: form.fullName.trim() },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Signup failed — no user returned.");

      // Upsert customer row (idempotent — handles re-signup / repeated submits)
      const { error: cErr } = await supabase.from("customers").upsert(
        {
          user_id: data.user.id,
          full_name: form.fullName.trim(),
          email: cleanEmail,
          phone: normalizedPhone() || null,
          country: form.country || null,
          binance_wallet_address: form.binanceWallet || null,
          referred_by: form.referredBy || null,
        },
        { onConflict: "user_id" },
      );
      if (cErr && !/duplicate|unique/i.test(cErr.message)) throw cErr;

      // If email confirmation is required, Supabase returns no session.
      if (!data.session) {
        setInfo("Account created. Check your email to confirm, then sign in.");
        return;
      }

      await routeAfterAuth(data.user.id);
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : "Something went wrong"));
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
          <span className="text-lg font-bold">Aura<span className="gradient-text">Trad.Ai</span></span>
        </Link>

        <h1 className="text-2xl font-bold text-center">{isLogin ? "Welcome back" : "Create your account"}</h1>
        <p className="text-sm text-muted-foreground text-center mt-1.5">
          {isLogin ? "Sign in to your investor dashboard." : "Fill in your details to get started."}
        </p>

        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setError(null);
            setInfo(null);
            setLoading(true);
            const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
            if (res.error) {
              setError(friendlyError(res.error.message));
              setLoading(false);
              return;
            }
            if (!res.redirected) await routeAfterAuth();
          }}
          className="mt-5 w-full px-4 py-3 rounded-xl bg-background border border-border hover:border-primary/60 font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
        </div>


        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          {!isLogin && (
            <input required value={form.fullName} onChange={upd("fullName")} placeholder="Full name" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
          )}
          <input required type="email" value={form.email} onChange={upd("email")} placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
          {!isLogin && (
            <>
              <input
                type="tel"
                value={form.phone}
                onChange={upd("phone")}
                placeholder="Phone number (optional, e.g. +14155552671)"
                className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none"
              />
              <input value={form.country} onChange={upd("country")} placeholder="Country" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
            </>
          )}
          <input required type="password" value={form.password} onChange={upd("password")} placeholder="Password (min 6 chars)" minLength={6} className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
          {!isLogin && (
            <input required type="password" value={form.confirmPassword} onChange={upd("confirmPassword")} placeholder="Confirm password" minLength={6} className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
          )}
          {!isLogin && (
            <input value={form.referredBy} onChange={upd("referredBy")} placeholder="Referral code (optional)" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="text-sm text-success">{info}</p>}
          <button disabled={loading} className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary inline-flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLogin ? "Sign in" : "Create account"}
          </button>
        </form>
        {isLogin && (
          <p className="text-xs text-center mt-3">
            <Link to="/forgot-password" className="text-primary hover:underline">Forgot your password?</Link>
          </p>
        )}
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
