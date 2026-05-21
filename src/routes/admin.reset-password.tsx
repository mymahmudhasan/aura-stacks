import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Hexagon, ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PasswordField } from "@/components/PasswordField";

export const Route = createFileRoute("/admin/reset-password")({
  component: AdminResetPassword,
  head: () => ({ meta: [{ title: "Reset Admin Password — AuraTrad.Ai" }, { name: "robots", content: "noindex" }] }),
});

function AdminResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Wait for Supabase to process the recovery token from the URL hash, then
  // verify the recovered user actually has the admin role before allowing a
  // password change.
  useEffect(() => {
    const verify = async (userId: string) => {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (role) {
        setAuthorized(true);
      } else {
        setError("This recovery link is not associated with an admin account.");
        await supabase.auth.signOut();
      }
      setChecking(false);
      setReady(true);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session?.user) {
        verify(session.user.id);
      }
    });

    // If the page is reloaded after the token was already consumed, fall back
    // to whatever session is present.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        verify(data.session.user.id);
      } else {
        // Give the recovery event a moment to fire.
        setTimeout(() => {
          setChecking(false);
          setReady(true);
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Use upper case, lower case, and a number.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: updErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    setSuccess(true);
    await supabase.auth.signOut();
    setTimeout(() => navigate({ to: "/login" }), 2000);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs uppercase tracking-widest text-primary mx-auto w-fit block">
          <ShieldCheck className="w-3 h-3 inline mr-1" /> Admin Recovery
        </div>
        <h1 className="text-2xl font-bold text-center mt-3">Reset Admin Password</h1>

        {!ready || checking ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Verifying recovery link…
          </div>
        ) : success ? (
          <div className="mt-6 text-center">
            <p className="text-success text-sm">Password updated. Redirecting to sign in…</p>
          </div>
        ) : !authorized ? (
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-destructive">
              {error ?? "This link has expired or is invalid. Request a new reset link."}
            </p>
            <Link to="/login" className="inline-block text-xs text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            <p className="text-xs text-muted-foreground">
              Choose a strong new password (min. 12 chars, mix of cases & numbers).
            </p>
            <PasswordField
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
            />
            <PasswordField
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {loading ? "Updating…" : "Set new password"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
