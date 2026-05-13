import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Hexagon } from "lucide-react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/mining", label: "Mining" },
  { to: "/staking", label: "Staking" },
  { to: "/ai-trading", label: "AI Trading" },
  { to: "/affiliate", label: "Affiliate" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border/40">
      <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <Hexagon className="w-8 h-8 text-primary fill-primary/20" strokeWidth={1.5} />
            <div className="absolute inset-0 blur-md bg-primary/40 -z-10 group-hover:bg-primary/60 transition" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Nova<span className="gradient-text">Vault</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {nav.map((n) => {
            const active = path === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3.5 py-2 text-sm rounded-lg transition ${
                  active
                    ? "text-foreground bg-white/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link
            to="/login"
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="relative px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition glow-primary"
          >
            Get started
          </Link>
        </div>

        <button
          className="lg:hidden p-2 text-foreground"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden glass-strong border-t border-border/40 px-5 py-4 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              {n.label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-border/40 flex gap-2">
            <Link to="/login" onClick={() => setOpen(false)} className="flex-1 px-4 py-2.5 text-sm text-center rounded-lg border border-border">Sign in</Link>
            <Link to="/register" onClick={() => setOpen(false)} className="flex-1 px-4 py-2.5 text-sm text-center rounded-lg bg-primary text-primary-foreground">Get started</Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/40 bg-background/40">
      <div className="mx-auto max-w-7xl px-5 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <Hexagon className="w-7 h-7 text-primary fill-primary/20" strokeWidth={1.5} />
            <span className="text-lg font-bold">Nova<span className="gradient-text">Vault</span></span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Next-generation crypto investment platform for mining, staking and AI-assisted trading.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/mining" className="hover:text-foreground">Mining Plans</Link></li>
            <li><Link to="/staking" className="hover:text-foreground">Staking</Link></li>
            <li><Link to="/ai-trading" className="hover:text-foreground">AI Trading</Link></li>
            <li><Link to="/affiliate" className="hover:text-foreground">Affiliate Program</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About Us</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/terms" className="hover:text-foreground">Terms & Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40">
        <div className="mx-auto max-w-7xl px-5 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} NovaVault. All rights reserved.</p>
          <p>Crypto investments carry risk. Always invest responsibly.</p>
        </div>
      </div>
    </footer>
  );
}

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
