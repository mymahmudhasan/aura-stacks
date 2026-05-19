import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, Crown, Flame, Gift, Zap, Check, Clock, Loader2, BadgePercent, Copy, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  listOffers,
  getMyOffers,
  claimOffer,
  goVipInvest,
  type OfferRow,
  type UserOfferRow,
} from "@/lib/offers.functions";

type Bonus = { id: string; amount: number; status: string; referred_handle: string | null; created_at: string; paid_at: string | null };

const ICONS: Record<string, React.ReactNode> = {
  welcome_boost: <Sparkles className="w-5 h-5" />,
  vip_lock: <Crown className="w-5 h-5" />,
  double_rewards: <Flame className="w-5 h-5" />,
  referral_bonus: <Gift className="w-5 h-5" />,
};

const ACCENT: Record<string, "primary" | "gold"> = {
  welcome_boost: "primary",
  vip_lock: "gold",
  double_rewards: "primary",
  referral_bonus: "gold",
};

function useCountdown(target: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  if (diff <= 0) return "expired";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

function OfferCountdown({ target }: { target: string | null }) {
  const txt = useCountdown(target);
  if (!txt) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <Clock className="w-3 h-3" /> {txt}
    </span>
  );
}

export function useOffersData() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [claims, setClaims] = useState<UserOfferRow[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const authed = !!sess.session;
      setSignedIn(authed);
      if (authed) {
        const res = await getMyOffers();
        setOffers(res.offers);
        setClaims(res.claims);
        setBonuses((res.referralBonuses ?? []) as Bonus[]);
      } else {
        setOffers(await listOffers());
        setClaims([]);
        setBonuses([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const claimsBySlug = useMemo(() => {
    const m = new Map<string, UserOfferRow>();
    claims.forEach((c) => m.set(c.offer_slug, c));
    return m;
  }, [claims]);

  return { signedIn, offers, claims, claimsBySlug, bonuses, loading, reload: load };
}

export function OffersGrid() {
  const nav = useNavigate();
  const { signedIn, offers, claimsBySlug, loading, reload } = useOffersData();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ slug: string; text: string; tone: "ok" | "err" } | null>(null);
  const [vipOpen, setVipOpen] = useState(false);

  const handle = async (o: OfferRow) => {
    if (!signedIn) { nav({ to: "/register" }); return; }
    setMsg(null);
    if (o.type === "vip_lock") { setVipOpen(true); return; }
    if (o.type === "referral_bonus") {
      const code = (await supabase.auth.getSession()).data.session?.user?.id ?? "";
      const url = `${window.location.origin}/register?ref=${code.slice(0, 8)}`;
      try {
        await navigator.clipboard.writeText(url);
        setMsg({ slug: o.slug, text: "Referral link copied!", tone: "ok" });
      } catch {
        setMsg({ slug: o.slug, text: url, tone: "ok" });
      }
      return;
    }
    setBusy(o.slug);
    try {
      await claimOffer({ data: { slug: o.slug } });
      setMsg({ slug: o.slug, text: "Boost activated", tone: "ok" });
      await reload();
    } catch (e) {
      setMsg({ slug: o.slug, text: e instanceof Error ? e.message : "Failed", tone: "err" });
    } finally { setBusy(null); }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-5">
        {offers.map((o) => {
          const claim = claimsBySlug.get(o.slug);
          const accent = ACCENT[o.type] ?? "primary";
          const isClaimed = claim && (claim.status === "active" || claim.status === "used");
          const expired = claim?.expires_at && new Date(claim.expires_at).getTime() < Date.now();
          return (
            <div key={o.slug} className={`relative rounded-2xl p-6 overflow-hidden ${accent === "gold" ? "glass-strong border-gold/30" : "glass"}`}>
              <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-30 ${accent === "gold" ? "bg-[image:var(--gradient-gold)]" : "bg-primary"}`} />
              <div className="relative flex items-start gap-4">
                <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${accent === "gold" ? "bg-[image:var(--gradient-gold)] text-gold-foreground" : "bg-primary/15 text-primary"}`}>
                  {ICONS[o.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${accent === "gold" ? "bg-gold/15 text-gold border border-gold/20" : "bg-primary/15 text-primary border border-primary/20"}`}>
                      <BadgePercent className="w-3 h-3" /> {o.badge}
                    </span>
                    {isClaimed && !expired && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-success/15 text-success border border-success/20">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                    {claim && <OfferCountdown target={claim.expires_at} />}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mt-2">{o.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{o.description}</p>

                  <button
                    onClick={() => handle(o)}
                    disabled={busy === o.slug || (isClaimed && !expired && o.type !== "referral_bonus" && o.type !== "vip_lock")}
                    className={`mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:scale-100 ${accent === "gold" ? "bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold" : "bg-primary text-primary-foreground glow-primary"}`}
                  >
                    {busy === o.slug ? <Loader2 className="w-4 h-4 animate-spin" /> :
                      o.type === "referral_bonus" ? <Copy className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    {isClaimed && !expired && o.type !== "referral_bonus" && o.type !== "vip_lock"
                      ? "Activated"
                      : o.cta_label}
                  </button>

                  {msg?.slug === o.slug && (
                    <p className={`mt-2 text-xs ${msg.tone === "ok" ? "text-success" : "text-destructive"}`}>{msg.text}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {vipOpen && <VipModal onClose={() => setVipOpen(false)} onDone={reload} />}
    </>
  );
}

function VipModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(5000);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      await goVipInvest({ data: { amount } });
      await onDone();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  };

  const projected = amount * 0.42;
  const daily = projected / 365;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl glass-strong border border-gold/40 p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[image:var(--gradient-gold)] text-gold-foreground flex items-center justify-center"><Crown className="w-5 h-5" /></div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">VIP 12-Month Lock</p>
            <h3 className="text-lg font-bold">Lock $5,000+ at 42% APY</h3>
          </div>
        </div>
        <div className="mt-5">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Lock amount (USDT)</label>
          <input
            type="number"
            min={5000}
            step={100}
            value={amount}
            onChange={(e) => setAmount(Math.max(5000, Number(e.target.value) || 0))}
            className="mt-2 w-full rounded-xl bg-background/60 border border-border/60 px-4 py-3 font-mono text-lg"
          />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl glass p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Daily reward</p>
              <p className="text-lg font-bold gradient-text">${daily.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-xl glass p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">At unlock (1y)</p>
              <p className="text-lg font-bold text-gold">${projected.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
          {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
          <button
            onClick={submit}
            disabled={busy || amount < 5000}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
            Activate VIP lock
          </button>
          <p className="mt-2 text-[11px] text-muted-foreground text-center">Locks {amount.toLocaleString()} USDT from your wallet for 365 days at 42% APY.</p>
        </div>
      </div>
    </div>
  );
}

export function OffersBanner() {
  const { signedIn, offers, claimsBySlug, bonuses, loading } = useOffersData();
  if (!signedIn || loading) return null;

  const active = offers
    .map((o) => ({ o, c: claimsBySlug.get(o.slug) }))
    .filter((x) => x.c && (x.c.status === "active" || x.c.status === "used") &&
      (!x.c.expires_at || new Date(x.c.expires_at).getTime() > Date.now()));

  const pending = bonuses.filter((b) => b.status === "pending");
  const paid = bonuses.filter((b) => b.status === "paid" || b.status === "approved");

  if (active.length === 0 && bonuses.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl p-[2px] bg-[image:var(--gradient-aurora)]">
      <div className="rounded-2xl bg-background/85 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <p className="text-xs uppercase tracking-widest text-gold">Your active offers</p>
          </div>
          <Link to="/staking" className="text-xs text-primary hover:underline">See all offers →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {active.map(({ o, c }) => (
            <div key={o.slug} className="rounded-xl glass p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">{ICONS[o.type]}</div>
                <p className="text-sm font-semibold truncate">{o.title}</p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/20">
                  <Check className="w-3 h-3" /> Active
                </span>
                <OfferCountdown target={c!.expires_at} />
              </div>
            </div>
          ))}
          {pending.length > 0 && (
            <div className="rounded-xl glass p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gold/15 text-gold flex items-center justify-center"><Gift className="w-4 h-4" /></div>
                <p className="text-sm font-semibold">Referral bonuses pending</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{pending.length} pending · ${pending.reduce((s, b) => s + Number(b.amount), 0)} awaiting admin approval</p>
            </div>
          )}
          {paid.length > 0 && (
            <div className="rounded-xl glass p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-success/15 text-success flex items-center justify-center"><Check className="w-4 h-4" /></div>
                <p className="text-sm font-semibold">Referral bonuses paid</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">${paid.reduce((s, b) => s + Number(b.amount), 0)} credited to your wallet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
