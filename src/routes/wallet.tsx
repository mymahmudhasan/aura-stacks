import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon, Loader2, TrendingUp, Cpu, Lock, Brain } from "lucide-react";
import { GlassCard, Section } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { getMyWallet, getMyInvestments } from "@/lib/wallet.functions";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
  head: () => ({ meta: [{ title: "My Wallet — Synexis" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
});

type Txn = { id: string; kind: string; amount: number; currency: string; status: string; notes: string | null; created_at: string };
type Inv = { id: string; service: string; plan_name: string; amount: number; currency: string; status: string; started_at: string | null; external_provider: string | null };
type Cust = { balance: number; total_deposited: number; total_withdrawn: number; currency: string | null; full_name: string | null };

const serviceIcon: Record<string, JSX.Element> = {
  ai_trading: <Brain className="w-4 h-4" />,
  mining: <Cpu className="w-4 h-4" />,
  staking: <Lock className="w-4 h-4" />,
};

function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [cust, setCust] = useState<Cust | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [invs, setInvs] = useState<Inv[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [w, i] = await Promise.all([getMyWallet(), getMyInvestments()]);
        setCust(w.customer as Cust | null);
        setTxns(w.transactions as Txn[]);
        setInvs(i as Inv[]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const balance = Number(cust?.balance ?? 0);
  return (
    <Section className="!py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground">My Wallet</p>
          <h1 className="text-2xl md:text-3xl font-bold">Hello, <span className="gradient-text">{cust?.full_name ?? "Investor"}</span></h1>
        </div>
        <div className="flex gap-2">
          <Link to="/deposit" className="rounded-xl px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 bg-[image:var(--gradient-gold)] text-gold-foreground glow-gold">
            <ArrowDownLeft className="w-4 h-4" /> Deposit
          </Link>
          <Link to="/withdraw" className="glass rounded-xl px-4 py-2 text-sm inline-flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-gold" /> Withdraw
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <GlassCard glow>
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[image:var(--gradient-gold)] text-gold-foreground flex items-center justify-center"><WalletIcon /></div>
          </div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4">Available Balance</p>
          <p className="text-3xl md:text-4xl font-extrabold mt-1 gradient-text">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </GlassCard>
        <GlassCard>
          <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><ArrowDownLeft /></div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4">Total Deposited</p>
          <p className="text-2xl font-bold mt-1">${Number(cust?.total_deposited ?? 0).toLocaleString()}</p>
        </GlassCard>
        <GlassCard>
          <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><ArrowUpRight /></div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4">Total Withdrawn</p>
          <p className="text-2xl font-bold mt-1">${Number(cust?.total_withdrawn ?? 0).toLocaleString()}</p>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Transactions</h3>
            <span className="text-xs text-muted-foreground">{txns.length} recent</span>
          </div>
          {txns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No transactions yet. <Link to="/deposit" className="text-primary">Make your first deposit →</Link></p>
          ) : (
            <ul className="divide-y divide-border/40">
              {txns.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="capitalize font-medium">{t.kind.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()} · {t.notes ?? ""}</p>
                  </div>
                  <span className={Number(t.amount) >= 0 ? "text-success font-medium" : "text-gold font-medium"}>
                    {Number(t.amount) >= 0 ? "+" : ""}{Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {t.currency}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">My Investments</h3>
            <Link to="/mining" className="text-xs text-primary">Browse plans →</Link>
          </div>
          {invs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No investments yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {invs.map((i) => (
                <li key={i.id} className="rounded-xl glass p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">{serviceIcon[i.service] ?? <TrendingUp className="w-4 h-4" />}</span>
                      <div>
                        <p className="font-medium text-sm">{i.plan_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{i.service.replace("_", " ")} · ${Number(i.amount).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${i.status === "active" ? "bg-success/15 text-success" : i.status === "pending" ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"}`}>{i.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </Section>
  );
}
