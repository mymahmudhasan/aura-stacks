import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Hexagon, Loader2, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
  head: () => ({ meta: [{ title: "Forgot password — NovaTrad.Ai" }] }),
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
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

        <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3 h-3" /> Back to sign in
        </Link>

        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 mx-auto mb-3">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-center">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground text-center mt-1.5">
          Enter your account email and we'll send you a secure link to reset your password.
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl border border-success/40 bg-success/10 p-4 text-sm text-foreground">
            <p className="font-medium">Check your inbox</p>
            <p className="text-muted-foreground mt-1">
              If an account exists for <span className="text-foreground">{email}</span>, you'll receive a reset link shortly. Don't forget to check spam.
            </p>
          </div>
        ) : (
          <form className="mt-5 space-y-3" onSubmit={onSubmit}>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send reset link
            </button>
          </form>
        )}

        <p className="text-sm text-center text-muted-foreground mt-5">
          Remembered it? <Link to="/login" className="text-primary">Sign in</Link>
        </p>
      </div>
    </section>
  );
}
