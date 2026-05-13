import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Wallet, ArrowDownLeft, ArrowUpRight, Search, ShieldCheck, Network, TrendingUp, Cable, BadgeCheck, Clock } from "lucide-react";
import { GlassCard, Section } from "@/components/ui-bits";

export const Route = createFileRoute("/admin")({
  component: Admin,
  head: () => ({ meta: [{ title: "Admin — NovaVault" }, { name: "robots", content: "noindex" }] }),
});

type Deposit = { id: string; user: string; email: string; binanceUid: string; amount: number; coin: string; status: "Confirmed" | "Pending" | "Manual"; date: string; txid: string };
type Withdrawal = { id: string; user: string; binanceUid: string; amount: number; coin: string; status: "Pending" | "Sent" | "Hold"; date: string };
type Referral = { sponsor: string; sponsorEmail: string; invited: number; activeInvested: number; commission: number; level1: number; level2: number; level3: number };
type User = { id: string; name: string; email: string; binanceUid: string; balance: number; joined: string; status: "Active" | "Pending KYC" };

const deposits: Deposit[] = [
  { id: "DP-10421", user: "Arif Hasan", email: "arif@novavault.io", binanceUid: "284910321", amount: 5000, coin: "USDT", status: "Confirmed", date: "2026-05-13 09:21", txid: "0x9a..f12c" },
  { id: "DP-10420", user: "Maria Lopez", email: "maria.l@gmail.com", binanceUid: "194820011", amount: 1200, coin: "USDT", status: "Pending", date: "2026-05-13 08:48", txid: "0x4c..82a1" },
  { id: "DP-10419", user: "John Becker", email: "j.becker@proton.me", binanceUid: "552014998", amount: 8400, coin: "BTC", status: "Confirmed", date: "2026-05-13 07:12", txid: "0x77..1a04" },
  { id: "DP-10418", user: "Aisha Rahman", email: "aisha.r@yahoo.com", binanceUid: "382001745", amount: 300, coin: "USDT", status: "Manual", date: "2026-05-12 22:01", txid: "0x12..ee30" },
  { id: "DP-10417", user: "Liam Chen", email: "liam.chen@outlook.com", binanceUid: "771234580", amount: 15000, coin: "ETH", status: "Confirmed", date: "2026-05-12 19:33", txid: "0xa1..bb98" },
  { id: "DP-10416", user: "Sara Khan", email: "sara.k@novavault.io", binanceUid: "664102994", amount: 750, coin: "USDT", status: "Pending", date: "2026-05-12 16:10", txid: "0x55..0d7e" },
];

const withdrawals: Withdrawal[] = [
  { id: "WD-2284", user: "Arif Hasan", binanceUid: "284910321", amount: 320, coin: "USDT", status: "Pending", date: "2026-05-13 10:02" },
  { id: "WD-2283", user: "Maria Lopez", binanceUid: "194820011", amount: 88, coin: "USDT", status: "Pending", date: "2026-05-13 09:40" },
  { id: "WD-2282", user: "John Becker", binanceUid: "552014998", amount: 1240, coin: "BTC", status: "Sent", date: "2026-05-12 21:55" },
  { id: "WD-2281", user: "Liam Chen", binanceUid: "771234580", amount: 410, coin: "ETH", status: "Hold", date: "2026-05-12 18:20" },
];

const referrals: Referral[] = [
  { sponsor: "Arif Hasan", sponsorEmail: "arif@novavault.io", invited: 24, activeInvested: 18, commission: 1842.5, level1: 12, level2: 8, level3: 4 },
  { sponsor: "John Becker", sponsorEmail: "j.becker@proton.me", invited: 17, activeInvested: 14, commission: 1218.0, level1: 9, level2: 6, level3: 2 },
  { sponsor: "Liam Chen", sponsorEmail: "liam.chen@outlook.com", invited: 11, activeInvested: 9, commission: 742.0, level1: 7, level2: 3, level3: 1 },
  { sponsor: "Maria Lopez", sponsorEmail: "maria.l@gmail.com", invited: 8, activeInvested: 5, commission: 318.0, level1: 5, level2: 2, level3: 1 },
  { sponsor: "Sara Khan", sponsorEmail: "sara.k@novavault.io", invited: 6, activeInvested: 4, commission: 220.0, level1: 4, level2: 2, level3: 0 },
];

const users: User[] = [
  { id: "U-001", name: "Arif Hasan", email: "arif@novavault.io", binanceUid: "284910321", balance: 12480, joined: "2025-09-12", status: "Active" },
  { id: "U-002", name: "Maria Lopez", email: "maria.l@gmail.com", binanceUid: "194820011", balance: 1188, joined: "2025-11-04", status: "Active" },
  { id: "U-003", name: "John Becker", email: "j.becker@proton.me", binanceUid: "552014998", balance: 24640, joined: "2025-07-22", status: "Active" },
  { id: "U-004", name: "Aisha Rahman", email: "aisha.r@yahoo.com", binanceUid: "382001745", balance: 290, joined: "2026-04-30", status: "Pending KYC" },
  { id: "U-005", name: "Liam Chen", email: "liam.chen@outlook.com", binanceUid: "771234580", balance: 18820, joined: "2025-10-14", status: "Active" },
  { id: "U-006", name: "Sara Khan", email: "sara.k@novavault.io", binanceUid: "664102994", balance: 730, joined: "2026-02-09", status: "Active" },
];

type Tab = "overview" | "deposits" | "withdrawals" | "referrals" | "users";

function Admin() {
  const [tab, setTab] = useState<Tab>("overview");
  const [q, setQ] = useState("");

  const totals = useMemo(() => ({
    deposits: deposits.reduce((s, d) => s + d.amount, 0),
    pendingWd: withdrawals.filter((w) => w.status === "Pending").reduce((s, w) => s + w.amount, 0),
    users: users.length,
    refCommission: referrals.reduce((s, r) => s + r.commission, 0),
  }), []);

  const filteredDeposits = deposits.filter((d) => match(d, q));
  const filteredWithdrawals = withdrawals.filter((w) => match(w, q));
  const filteredReferrals = referrals.filter((r) => match(r, q));
  const filteredUsers = users.filter((u) => match(u, q));

  return (
    <Section className="!py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs uppercase tracking-widest text-primary mb-2">
            <ShieldCheck className="w-3 h-3" /> Admin Console
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">NovaVault <span className="gradient-text">Operations</span></h1>
          <p className="text-sm text-muted-foreground mt-1">Track deposits, manual withdrawals, referrals and user accounts.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search user, email, UID, txid…"
            className="pl-9 pr-4 py-2.5 w-72 rounded-xl bg-input/50 border border-border focus:border-primary outline-none text-sm"
          />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<Wallet />} label="Total Deposits" value={`$${totals.deposits.toLocaleString()}`} trend={`${deposits.length} txs`} />
        <Kpi icon={<Clock />} label="Pending Withdrawals" value={`$${totals.pendingWd.toLocaleString()}`} trend="Send via Binance" warn />
        <Kpi icon={<Users />} label="Total Users" value={String(totals.users)} trend="+2 this week" />
        <Kpi icon={<Network />} label="Referral Commissions" value={`$${totals.refCommission.toLocaleString()}`} trend="Paid out" />
      </div>

      {/* Tabs */}
      <div className="mt-7 flex flex-wrap gap-2">
        {([
          ["overview", "Overview"],
          ["deposits", "Deposits"],
          ["withdrawals", "Withdrawals"],
          ["referrals", "Referrals"],
          ["users", "Users"],
        ] as [Tab, string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm transition ${tab === k ? "bg-primary text-primary-foreground glow-primary" : "glass hover:border-primary/30"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5">
        {(tab === "overview" || tab === "deposits") && (
          <GlassCard>
            <SectionHead icon={<ArrowDownLeft className="w-4 h-4 text-success" />} title="Recent Deposits" sub="Who deposited, how much, and from which Binance UID." />
            <Table headers={["ID", "User", "Email", "Binance UID", "Amount", "Coin", "Status", "Date", "TxID"]}>
              {filteredDeposits.map((d) => (
                <tr key={d.id} className="border-t border-border/40 hover:bg-white/5">
                  <Td mono>{d.id}</Td>
                  <Td>{d.user}</Td>
                  <Td muted>{d.email}</Td>
                  <Td mono>{d.binanceUid}</Td>
                  <Td className="font-semibold">${d.amount.toLocaleString()}</Td>
                  <Td>{d.coin}</Td>
                  <Td><StatusPill v={d.status} /></Td>
                  <Td muted>{d.date}</Td>
                  <Td mono muted>{d.txid}</Td>
                </tr>
              ))}
            </Table>
          </GlassCard>
        )}

        {(tab === "overview" || tab === "withdrawals") && (
          <GlassCard>
            <SectionHead icon={<ArrowUpRight className="w-4 h-4 text-gold" />} title="Withdrawal Queue" sub="Send funds manually to each user's Binance UID, then mark as Sent." />
            <Table headers={["ID", "User", "Binance UID", "Amount", "Coin", "Status", "Requested", "Action"]}>
              {filteredWithdrawals.map((w) => (
                <tr key={w.id} className="border-t border-border/40 hover:bg-white/5">
                  <Td mono>{w.id}</Td>
                  <Td>{w.user}</Td>
                  <Td mono>{w.binanceUid}</Td>
                  <Td className="font-semibold">${w.amount.toLocaleString()}</Td>
                  <Td>{w.coin}</Td>
                  <Td><StatusPill v={w.status} /></Td>
                  <Td muted>{w.date}</Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <button className="px-2.5 py-1 rounded-lg text-xs bg-success/15 text-success hover:bg-success/25">Mark Sent</button>
                      <button className="px-2.5 py-1 rounded-lg text-xs glass hover:border-primary/30">Hold</button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          </GlassCard>
        )}

        {(tab === "overview" || tab === "referrals") && (
          <GlassCard>
            <SectionHead icon={<Network className="w-4 h-4 text-primary" />} title="Top Referrers" sub="Who referred whom, across 3 commission levels." />
            <Table headers={["Sponsor", "Email", "Invited", "Active", "L1", "L2", "L3", "Commission"]}>
              {filteredReferrals.map((r) => (
                <tr key={r.sponsorEmail} className="border-t border-border/40 hover:bg-white/5">
                  <Td>{r.sponsor}</Td>
                  <Td muted>{r.sponsorEmail}</Td>
                  <Td>{r.invited}</Td>
                  <Td className="text-success">{r.activeInvested}</Td>
                  <Td mono>{r.level1}</Td>
                  <Td mono>{r.level2}</Td>
                  <Td mono>{r.level3}</Td>
                  <Td className="font-semibold gradient-text">${r.commission.toLocaleString()}</Td>
                </tr>
              ))}
            </Table>
          </GlassCard>
        )}

        {(tab === "overview" || tab === "users") && (
          <GlassCard>
            <SectionHead icon={<Users className="w-4 h-4 text-primary" />} title="Account Holders" sub="Every user must have a verified Binance account for withdrawals." />
            <Table headers={["ID", "Name", "Email", "Binance UID", "Balance", "Joined", "Status"]}>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t border-border/40 hover:bg-white/5">
                  <Td mono>{u.id}</Td>
                  <Td>{u.name}</Td>
                  <Td muted>{u.email}</Td>
                  <Td mono className="flex items-center gap-1.5"><Cable className="w-3 h-3 text-primary" />{u.binanceUid}</Td>
                  <Td className="font-semibold">${u.balance.toLocaleString()}</Td>
                  <Td muted>{u.joined}</Td>
                  <Td><StatusPill v={u.status} /></Td>
                </tr>
              ))}
            </Table>
          </GlassCard>
        )}
      </div>
    </Section>
  );
}

function match(o: object, q: string) {
  if (!q) return true;
  return JSON.stringify(o).toLowerCase().includes(q.toLowerCase());
}

function Kpi({ icon, label, value, trend, warn }: { icon: React.ReactNode; label: string; value: string; trend: string; warn?: boolean }) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${warn ? "bg-gold/15 text-gold" : "bg-primary/15 text-primary"}`}>{icon}</div>
        <span className={`text-xs ${warn ? "text-gold" : "text-success"}`}>{trend}</span>
      </div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </GlassCard>
  );
}

function SectionHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg glass flex items-center justify-center">{icon}</div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="text-xs uppercase tracking-widest text-muted-foreground">
            {headers.map((h) => (
              <th key={h} className="text-left font-medium px-3 py-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, muted, mono, className = "" }: { children: React.ReactNode; muted?: boolean; mono?: boolean; className?: string }) {
  return <td className={`px-3 py-3 align-middle ${muted ? "text-muted-foreground" : ""} ${mono ? "font-mono text-xs" : ""} ${className}`}>{children}</td>;
}

function StatusPill({ v }: { v: string }) {
  const map: Record<string, string> = {
    Confirmed: "bg-success/15 text-success",
    Sent: "bg-success/15 text-success",
    Active: "bg-success/15 text-success",
    Pending: "bg-gold/15 text-gold",
    "Pending KYC": "bg-gold/15 text-gold",
    Manual: "bg-primary/15 text-primary",
    Hold: "bg-destructive/15 text-destructive",
  };
  const Icon = v === "Active" || v === "Confirmed" || v === "Sent" ? BadgeCheck : v === "Hold" ? TrendingUp : Clock;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${map[v] || "glass"}`}>
      <Icon className="w-3 h-3" /> {v}
    </span>
  );
}
