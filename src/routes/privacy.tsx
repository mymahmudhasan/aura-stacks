import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Section } from "@/components/ui-bits";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => ({ meta: [{ title: "Privacy Policy — AuraTrad.Ai" }] }),
});

function Privacy() {
  return (
    <>
      <PageHero eyebrow="Legal" title={<>Privacy <span className="gradient-text">Policy</span></>} subtitle="How we collect, use and protect your information." />
      <Section>
        <div className="max-w-3xl mx-auto text-muted-foreground space-y-5 text-sm leading-relaxed">
          <p>We collect only the data necessary to operate your account: email, wallet addresses, KYC documents (when required) and transaction history.</p>
          <h3 className="text-foreground font-semibold text-base">Data security</h3>
          <p>All sensitive data is encrypted at rest with AES-256 and in transit with TLS 1.3.</p>
          <h3 className="text-foreground font-semibold text-base">Your rights</h3>
          <p>You may request export or deletion of your personal data at any time by contacting support.</p>
          <h3 className="text-foreground font-semibold text-base">Cookies</h3>
          <p>We use minimal cookies for authentication and analytics. No third-party advertising trackers.</p>
        </div>
      </Section>
    </>
  );
}
