import { createFileRoute, Link } from "@tanstack/react-router";
import { Hexagon, Cable } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Sign in — NovaVault" }] }),
});

function Login() {
  return <AuthCard mode="login" />;
}

export function AuthCard({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-5 py-16">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 bg-[image:var(--gradient-aurora)]" />
      <div className="relative w-full max-w-md glass-strong rounded-3xl p-8 glow-primary">
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-6">
          <Hexagon className="w-8 h-8 text-primary fill-primary/20" strokeWidth={1.5} />
          <span className="text-lg font-bold">Nova<span className="gradient-text">Vault</span></span>
        </Link>
        <h1 className="text-2xl font-bold text-center">{isLogin ? "Welcome back" : "Create your account"}</h1>
        <p className="text-sm text-muted-foreground text-center mt-1.5">{isLogin ? "Sign in to your investor dashboard." : "Start earning crypto in minutes."}</p>

        {!isLogin && (
          <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-2.5">
            <Cable className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">Binance account required.</span> All withdrawals and rewards are sent manually to your verified Binance wallet.
            </p>
          </div>
        )}

        <form className="mt-5 space-y-3" onSubmit={(e) => e.preventDefault()}>
          {!isLogin && <input placeholder="Full name" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />}
          <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
          {!isLogin && <input placeholder="Binance UID (required)" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none font-mono text-sm" />}
          <input type="password" placeholder="Password" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
          {!isLogin && <input placeholder="Referral code (optional)" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />}
          <button className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary">{isLogin ? "Sign in" : "Create account"}</button>
        </form>
        {!isLogin && (
          <p className="text-[11px] text-center text-muted-foreground mt-3">
            Don't have a Binance account? <a href="https://accounts.binance.com/register" target="_blank" rel="noopener noreferrer" className="text-primary">Create one →</a>
          </p>
        )}
        <p className="text-sm text-center text-muted-foreground mt-5">
          {isLogin ? <>New here? <Link to="/register" className="text-primary">Create an account</Link></> : <>Already a member? <Link to="/login" className="text-primary">Sign in</Link></>}
        </p>
      </div>
    </section>
  );
}
