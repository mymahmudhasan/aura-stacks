import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Hexagon, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
  head: () => ({ meta: [{ title: "Admin Sign In — AuraTrad.Ai" }, { name: "robots", content: "noindex" }] }),
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const onForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    setResetLoading(true);
    // Always show the same neutral message regardless of whether the email
    // exists or has admin role — prevents account enumeration. Server-side,
    // the reset page will refuse to set a new password unless the recovered
    // user actually has the admin role.
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setResetLoading(false);
    setResetMsg("If an admin account exists for that email, a secure reset link has been sent.");
    setResetEmail("");
  };


  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (roles) navigate({ to: "/admin" });
      }
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr || !data.user) {
      setLoading(false);
      setError(signInErr?.message ?? "Invalid credentials");
      return;
    }
    const { data: role, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();
    setLoading(false);
    if (roleErr || !role) {
      await supabase.auth.signOut();
      setError("This account does not have admin access.");
      return;
    }
    navigate({ to: "/admin" });
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs uppercase tracking-widest text-primary mx-auto w-fit block">
          <ShieldCheck className="w-3 h-3 inline mr-1" /> Admin Console
        </div>
        <h1 className="text-2xl font-bold text-center mt-3">Admin Sign In</h1>
        <p className="text-sm text-muted-foreground text-center mt-1.5">Restricted access. Operator credentials only.</p>

        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email"
            className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign in to console"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => { setResetOpen((v) => !v); setResetMsg(null); }}
            className="text-xs text-primary hover:underline"
          >
            {resetOpen ? "Hide password reset" : "Forgot password?"}
          </button>
        </div>

        {resetOpen && (
          <form onSubmit={onForgot} className="mt-4 space-y-3 glass rounded-xl p-4 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              Enter the admin email. We'll send a one-time secure link to set a new password.
            </p>
            <input
              type="email"
              required
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="admin@yourdomain.com"
              className="w-full px-4 py-2.5 rounded-xl bg-input/50 border border-border focus:border-primary outline-none text-sm"
            />
            <button
              type="submit"
              disabled={resetLoading}
              className="w-full px-4 py-2.5 rounded-xl glass hover:bg-white/10 text-foreground text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {resetLoading ? "Sending…" : "Send reset link"}
            </button>
            {resetMsg && <p className="text-xs text-success text-center">{resetMsg}</p>}
          </form>
        )}


        <p className="text-[11px] text-center text-muted-foreground mt-5">
          Need an admin account? Create a regular user, then ask an existing admin to grant the role from the database.
        </p>
      </div>
    </section>
  );
}
