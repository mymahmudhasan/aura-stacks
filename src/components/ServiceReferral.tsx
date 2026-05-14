import { Link } from "@tanstack/react-router";
import { Users, Gift, Copy, ArrowRight, Share2 } from "lucide-react";
import { GlassCard } from "@/components/ui-bits";

type Tier = { level: string; rate: string; note: string };

export function ServiceReferral({
  serviceName,
  accent = "primary",
  tiers,
  bonus,
}: {
  serviceName: string;
  accent?: "primary" | "gold";
  tiers: Tier[];
  bonus?: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20">
      <div className="relative rounded-3xl glass-strong p-8 md:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[image:var(--gradient-aurora)] opacity-50 pointer-events-none" />
        <div className="relative grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs uppercase tracking-widest text-primary mb-4">
              <Share2 className="w-3 h-3" /> Referral Program · {serviceName}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Earn a <span className="gradient-text">commission</span> for every {serviceName.toLowerCase()} investor you refer.
            </h2>
            <p className="mt-4 text-sm md:text-base text-muted-foreground">
              Share your unique {serviceName} link. When your friends invest, you earn lifetime crypto commissions on every deposit and reward — paid daily to your Binance wallet.
            </p>
            {bonus && (
              <div className="mt-5 inline-flex items-start gap-2 px-4 py-2.5 rounded-xl bg-[image:var(--gradient-gold)] text-gold-foreground text-sm font-medium">
                <Gift className="w-4 h-4 mt-0.5" /> {bonus}
              </div>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium glow-primary">
                Get my referral link <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/affiliate" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-sm font-medium">
                Full commission rules
              </Link>
            </div>
          </div>

          <div className="lg:col-span-3 grid sm:grid-cols-3 gap-4">
            {tiers.map((t) => (
              <GlassCard key={t.level} className="text-center">
                <div className={`mx-auto w-11 h-11 rounded-xl ${accent === "gold" ? "bg-[image:var(--gradient-gold)] text-gold-foreground" : "bg-primary/15 text-primary"} flex items-center justify-center mb-3`}>
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{t.level}</p>
                <p className={`mt-2 text-4xl font-bold ${accent === "gold" ? "text-gold" : "gradient-text"}`}>{t.rate}</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{t.note}</p>
              </GlassCard>
            ))}
            <GlassCard className="sm:col-span-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><Copy className="w-4 h-4" /></div>
                <div className="flex-1 min-w-[200px]">
                  <p className="text-xs text-muted-foreground">Your {serviceName} referral link</p>
                  <p className="text-sm font-mono mt-0.5 truncate">novavault.io/r/<span className="text-primary">your-id</span>?p={serviceName.toLowerCase().replace(/\s+/g, "-")}</p>
                </div>
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-success/15 text-success border border-success/20">Lifetime</span>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
