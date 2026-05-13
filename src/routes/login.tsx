import { createFileRoute, Link } from "@tanstack/react-router";
import { Hexagon } from "lucide-react";

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
        <form className="mt-6 space-y-3" onSubmit={(e) => e.preventDefault()}>
          {!isLogin && <input placeholder="Full name" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />}
          <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
          <input type="password" placeholder="Password" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
          {!isLogin && <input placeholder="Referral code (optional)" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />}
          <button className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary">{isLogin ? "Sign in" : "Create account"}</button>
        </form>
        <p className="text-sm text-center text-muted-foreground mt-5">
          {isLogin ? <>New here? <Link to="/register" className="text-primary">Create an account</Link></> : <>Already a member? <Link to="/login" className="text-primary">Sign in</Link></>}
        </p>
      </div>
    </section>
  );
}
