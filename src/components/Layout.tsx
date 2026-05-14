import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ShieldCheck, BadgeCheck, Award, Lock, Globe2, Cpu, Phone } from "lucide-react";
import logo from "@/assets/novatrad-logo.png";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";

const nav = [
  { to: "/", label: "Home" },
  { to: "/mining", label: "Mining" },
  { to: "/staking", label: "Staking" },
  { to: "/ai-trading", label: "AI Trading" },
  { to: "/affiliate", label: "Affiliate" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/support", label: "Support" },
  { to: "/admin", label: "Admin" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border/40">
      <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <img src={logo} alt="NovaTrad.Ai logo" width={36} height={36} className="w-9 h-9 object-contain" />
            <div className="absolute inset-0 blur-md bg-primary/40 -z-10 group-hover:bg-primary/60 transition" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            NovaTrad<span className="gradient-text">.Ai</span>
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

const offices = [
  { country: "United States", city: "HQ", flag: "🇺🇸", address: "350 5th Avenue, 21st Floor, New York, NY 10118", phone: "+1 212 555 0142" },
  { country: "Singapore", city: "APAC", flag: "🇸🇬", address: "1 Raffles Place, Tower 2, #20-61, Singapore 048616", phone: "+65 6232 0188" },
  { country: "Saudi Arabia", city: "MENA", flag: "🇸🇦", address: "Kingdom Tower, Olaya District, Riyadh 12214", phone: "+966 11 211 7400" },
  { country: "Bangladesh", city: "South Asia", flag: "🇧🇩", address: "Bay's Galleria, Plot 2, Gulshan-1, Dhaka 1212", phone: "+880 1700 998877" },
  { country: "Canada", city: "Americas", flag: "🇨🇦", address: "181 Bay Street, Suite 4400, Toronto, ON M5J 2T3", phone: "+1 416 555 0177" },
  { country: "India", city: "Operations", flag: "🇮🇳", address: "One BKC, Tower A, Bandra Kurla Complex, Mumbai 400051", phone: "+91 22 6155 0900" },
  { country: "United Kingdom", city: "Europe", flag: "🇬🇧", address: "30 St Mary Axe, Level 28, London EC3A 8BF", phone: "+44 20 7946 0123" },
  { country: "Norway", city: "Nordics", flag: "🇳🇴", address: "Aker Brygge, Bryggegata 6, 0250 Oslo", phone: "+47 21 04 88 00" },
];

export function Footer() {
  const badges = [
    { icon: <ShieldCheck className="w-4 h-4" />, label: "ISO 27001" },
    { icon: <BadgeCheck className="w-4 h-4" />, label: "SOC 2 Type II" },
    { icon: <Lock className="w-4 h-4" />, label: "AES-256 Encrypted" },
    { icon: <Award className="w-4 h-4" />, label: "PCI DSS Level 1" },
    { icon: <Cpu className="w-4 h-4" />, label: "Binance Compatible" },
    { icon: <Globe2 className="w-4 h-4" />, label: "GDPR Compliant" },
  ];
  const marquee = [
    "AI Trading 24/7",
    "Daily Rewards",
    "Binance Verified Payouts",
    "Bank-grade Security",
    "Trusted by 240,000+ Investors",
    "Neural Strategy Engine",
  ];

  return (
    <footer className="mt-24 border-t border-border/40 bg-background/40">
      {/* Animated marquee strip */}
      <div className="border-b border-border/40 overflow-hidden bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
        <div className="flex w-max animate-marquee py-4">
          {[...marquee, ...marquee].map((t, i) => (
            <div key={i} className="flex items-center gap-3 px-8 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-sm md:text-base font-semibold tracking-wide text-shimmer whitespace-nowrap">
                {t}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="border-b border-border/40">
        <div className="mx-auto max-w-7xl px-5 py-8">
          <p className="text-center text-xs uppercase tracking-[0.25em] text-muted-foreground mb-5">
            Certifications & Compliance
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {badges.map((b) => (
              <div
                key={b.label}
                className="group flex items-center gap-2 px-4 py-2 rounded-full glass border border-border/60 hover:border-primary/40 hover:-translate-y-0.5 transition"
              >
                <span className="text-primary group-hover:scale-110 transition">{b.icon}</span>
                <span className="text-xs md:text-sm font-medium">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global offices */}
      <div className="border-b border-border/40 bg-background/40">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Global Presence</p>
            <h3 className="text-2xl md:text-3xl font-bold">Our offices around the <span className="gradient-text">world</span></h3>
            <p className="text-sm text-muted-foreground mt-2">Local teams. 24/7 multilingual support.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {offices.map((o) => (
              <div key={o.country} className="glass rounded-xl p-4 hover:border-primary/40 transition">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl leading-none">{o.flag}</span>
                  <p className="text-sm font-semibold">{o.country}</p>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase tracking-wider">{o.city}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{o.address}</p>
                <a href={`tel:${o.phone.replace(/\s/g, "")}`} className="mt-2 inline-flex items-center gap-1.5 text-xs text-success hover:underline font-mono">
                  <Phone className="w-3 h-3" /> {o.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <img src={logo} alt="NovaTrad.Ai logo" width={32} height={32} className="w-8 h-8 object-contain" loading="lazy" />
            <span className="text-lg font-bold">NovaTrad<span className="gradient-text">.Ai</span></span>
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
          <p>© {new Date().getFullYear()} NovaTrad.Ai. All rights reserved.</p>
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
      <WhatsAppWidget />
    </div>
  );
}
