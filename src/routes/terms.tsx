import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Section } from "@/components/ui-bits";

export const Route = createFileRoute("/terms")({
  component: Terms,
  head: () => ({ meta: [{ title: "Terms & Conditions — NovaTrad.Ai" }] }),
});

function Terms() {
  return (
    <>
      <PageHero eyebrow="Legal" title={<>Terms & <span className="gradient-text">Conditions</span></>} subtitle="Please read these terms carefully before using NovaTrad.Ai." />
      <Section>
        <div className="prose prose-invert max-w-3xl mx-auto text-muted-foreground space-y-5 text-sm leading-relaxed">
          <p>By accessing NovaTrad.Ai, you agree to these Terms. Crypto investments carry risk including potential loss of capital. Past performance does not guarantee future results.</p>
          <h3 className="text-foreground font-semibold text-base">1. Eligibility</h3>
          <p>You must be 18+ and legally permitted to invest in cryptocurrencies in your jurisdiction.</p>
          <h3 className="text-foreground font-semibold text-base">2. Withdrawals</h3>
          <p>Withdrawal requests are pending up to 7 days. Amounts above $25 require manual admin review and are returned to the original deposit wallet.</p>
          <h3 className="text-foreground font-semibold text-base">3. Acceptable Use</h3>
          <p>You agree not to use the platform for illegal activities, fraud or money laundering.</p>
          <h3 className="text-foreground font-semibold text-base">4. Liability</h3>
          <p>NovaTrad.Ai is provided "as is". To the maximum extent permitted by law, we disclaim warranties for losses arising from market volatility.</p>
        </div>
      </Section>
    </>
  );
}
