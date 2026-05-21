import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Hexagon, Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PasswordField } from "@/components/PasswordField";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  head: () => ({ meta: [{ title: "Reset password — AuraTrad.Ai" }, { name: "robots", content: "noindex" }] }),
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Only PASSWORD_RECOVERY authorizes a password change here.
    // Having a normal active session is NOT enough.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session?.user) {
        setAuthorized(true);
        setReady(true);
      }
    });

    // Give Supabase a moment to parse the recovery hash and fire the event.
    const timeout = setTimeout(() => setReady(true), 1800);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
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
    setTimeout(() => navigate({ to: "/dashboard" }), 1500);
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
        <h1 className="text-2xl font-bold text-center">Set a new password</h1>

        {!ready ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Verifying your recovery link…</span>
            <span className="text-xs">This only takes a moment.</span>
          </div>
        ) : success ? (
          <div className="mt-6 text-center space-y-2">
            <p className="text-success text-sm font-medium">Password updated successfully.</p>
            <p className="text-xs text-muted-foreground">Redirecting you to your dashboard…</p>
          </div>
        ) : !authorized ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
              <p className="font-medium text-destructive">Reset link invalid or expired</p>
              <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                Password reset links are single-use and expire after 1 hour. This can happen if:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 ml-4 list-disc space-y-0.5">
                <li>The link has already been used</li>
                <li>More than 1 hour has passed since the email was sent</li>
                <li>You opened the link in a different browser than where you requested it</li>
                <li>A newer reset email was sent (only the most recent works)</li>
              </ul>
            </div>
            <Link
              to="/forgot-password"
              className="block w-full text-center px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary"
            >
              Request a new reset link
            </Link>
            <p className="text-xs text-center text-muted-foreground">
              Remembered your password? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </div>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={onSubmit}>
            <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-xs text-muted-foreground">
              <p className="text-success font-medium mb-0.5">Link verified ✓</p>
              Choose a new password below. Use at least 6 characters — a mix of letters, numbers, and symbols is best.
            </div>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none"
            />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none"
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
