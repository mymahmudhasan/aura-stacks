import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, BadgeCheck, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Info = { email: string; type: "demo" | "real" } | null;

export function AccountBadge({ compact = false }: { compact?: boolean }) {
  const [info, setInfo] = useState<Info>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async (userId: string | null, email: string | null) => {
      if (!userId) {
        if (active) setInfo(null);
        return;
      }
      const { data } = await supabase
        .from("customers")
        .select("account_type")
        .eq("user_id", userId)
        .maybeSingle();
      if (!active) return;
      setInfo({
        email: email ?? "",
        type: (data?.account_type as "demo" | "real") ?? "demo",
      });
    };

    supabase.auth.getUser().then(({ data }) => {
      load(data.user?.id ?? null, data.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      load(session?.user?.id ?? null, session?.user?.email ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!info) return null;

  const isDemo = info.type === "demo";
  const pill = isDemo
    ? "border-success/40 bg-success/10 text-success"
    : "border-primary/40 bg-primary/10 text-primary";
  const Icon = isDemo ? Sparkles : BadgeCheck;
  const label = isDemo ? "Demo" : "Real";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl glass px-2.5 py-1.5 hover:bg-white/5 transition"
      >
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${pill}`}
        >
          <Icon className="w-3 h-3" /> {label}
        </span>
        {!compact && (
          <span className="hidden md:inline text-xs text-muted-foreground max-w-[140px] truncate">
            {info.email}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-2xl glass-strong border border-border/40 p-2 z-50"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-3 py-2.5 border-b border-border/40">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-medium truncate">{info.email}</p>
            <span
              className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${pill}`}
            >
              <Icon className="w-3 h-3" />
              {isDemo ? "Demo account" : "Real account"}
            </span>
            {isDemo && (
              <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                Deposit any amount to upgrade to a real account automatically.
              </p>
            )}
          </div>
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
          >
            <User className="w-4 h-4" /> Dashboard
          </Link>
          <button
            onClick={async () => {
              setOpen(false);
              await supabase.auth.signOut();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function useIsSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSignedIn(!!s?.user),
    );
    return () => sub.subscription.unsubscribe();
  }, []);
  return signedIn;
}
