import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Section({
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-7xl px-5 py-20 ${className}`}>
      {(eyebrow || title || subtitle) && (
        <div className="max-w-2xl mb-12">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs uppercase tracking-widest text-primary mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {eyebrow}
            </div>
          )}
          {title && <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{title}</h2>}
          {subtitle && <p className="text-base md:text-lg text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function GlassCard({
  children,
  className = "",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative glass rounded-2xl p-6 transition hover:border-primary/30 ${
        glow ? "glow-primary" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CTA({
  to,
  children,
  variant = "primary",
  className = "",
}: {
  to: string;
  children: ReactNode;
  variant?: "primary" | "gold" | "ghost";
  className?: string;
}) {
  const styles = {
    primary:
      "bg-primary text-primary-foreground hover:opacity-90 glow-primary",
    gold: "bg-[image:var(--gradient-gold)] text-gold-foreground hover:opacity-90 glow-gold",
    ghost: "glass hover:bg-white/10 text-foreground",
  }[variant];

  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_15px_35px_-10px_hsl(var(--primary)/0.6)] ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}

export function StatPill({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl md:text-3xl font-bold mt-1.5 gradient-text">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border/40">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute inset-0 bg-[image:var(--gradient-aurora)]" />
      <div className="relative mx-auto max-w-7xl px-5 py-20 md:py-28 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs uppercase tracking-widest text-primary mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {eyebrow}
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
          {title}
        </h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
