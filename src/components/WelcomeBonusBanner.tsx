import { useEffect, useState } from "react";
import { Gift, X } from "lucide-react";
import { getMyWelcomeBonus } from "@/lib/wallet.functions";

export function WelcomeBonusBanner({ userId }: { userId: string }) {
  const [bonus, setBonus] = useState<{ amount: number; granted_at: string } | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const key = `welcome_bonus_dismissed_${userId}`;
    setDismissed(localStorage.getItem(key) === "1");
    getMyWelcomeBonus()
      .then((d) => {
        if (d) setBonus({ amount: Number((d as { amount: number }).amount), granted_at: (d as { granted_at: string }).granted_at });
      })
      .catch(() => { /* ignore */ });
  }, [userId]);

  if (!bonus || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(`welcome_bonus_dismissed_${userId}`, "1");
    setDismissed(true);
  };

  return (
    <div className="mb-6 rounded-2xl p-[1.5px] bg-[image:var(--gradient-gold)] glow-gold animate-fade-in">
      <div className="rounded-2xl bg-background/90 backdrop-blur-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-[image:var(--gradient-gold)] text-gold-foreground flex items-center justify-center shrink-0 shadow-[var(--shadow-gold)]">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm sm:text-base font-bold">
              <span className="gradient-text">Welcome aboard!</span> We just credited <span className="text-gold font-extrabold">${bonus.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> to your balance.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              That's your <strong>25% first-deposit bonus</strong> — automatically added on top of your deposit. Put it to work in AI Trading, Mining or Staking and start earning today.
            </p>
          </div>
        </div>
        <button onClick={dismiss} className="glass rounded-lg p-2 hover:bg-white/10 shrink-0" title="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
