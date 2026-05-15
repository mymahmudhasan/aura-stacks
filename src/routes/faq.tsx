import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { PageHero, Section } from "@/components/ui-bits";

export const Route = createFileRoute("/faq")({
  component: FAQ,
  head: () => ({
    meta: [
      { title: "FAQ — AuraTrad.Ai" },
      { name: "description", content: "Common questions about AuraTrad.Ai mining, staking, AI trading, deposits and withdrawals." },
    ],
  }),
});

const faqs = [
  { q: "How fast are deposits processed?", a: "Crypto deposits are confirmed on-chain within minutes and credited automatically to your AuraTrad.Ai wallet." },
  { q: "How do withdrawals work?", a: "Withdrawal requests stay pending for up to 7 days for security review. Small amounts ($10–$25) are typically processed within 24 hours. Larger withdrawals are reviewed by our admin team and returned to your original deposit wallet." },
  { q: "Is my crypto safe with AuraTrad.Ai?", a: "Yes — we use multi-sig cold-storage architecture, AES-256 encryption and 24/7 monitoring with SOC 2 compliance." },
  { q: "What's the minimum to start mining?", a: "Our Starter Mining Plan begins at $100. Higher tiers unlock better daily reward rates." },
  { q: "Can I unstake early?", a: "Flexible staking allows withdrawal anytime. Fixed-term plans require completion of the lock period for full rewards." },
  { q: "Does AI trading guarantee profit?", a: "No system can guarantee profit. Our AI executes optimized strategies with active risk controls — past performance does not guarantee future returns." },
  { q: "How does the referral program pay?", a: "Earn 10% / 5% / 2% lifetime commissions across 3 referral tiers, paid in crypto to your wallet." },
  { q: "Which wallets are supported?", a: "All major Binance-compatible wallets including BTC, ETH, USDT (TRC20/ERC20/BEP20), BNB, SOL, and more." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <>
      <PageHero eyebrow="Help" title={<>Frequently asked <span className="gradient-text">questions</span></>} subtitle="Everything you need to know about investing on AuraTrad.Ai." />
      <Section>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((f, i) => (
            <button
              key={f.q}
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left glass rounded-2xl p-5 hover:border-primary/30 transition"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium">{f.q}</span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition ${open === i ? "rotate-180 text-primary" : ""}`} />
              </div>
              {open === i && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>}
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}
