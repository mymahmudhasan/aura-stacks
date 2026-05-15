import { createFileRoute } from "@tanstack/react-router";
import { Shield, Globe, Award, Users } from "lucide-react";
import { GlassCard, PageHero, Section } from "@/components/ui-bits";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About — AuraTrad.Ai" },
      { name: "description", content: "AuraTrad.Ai is a premium crypto investment platform building secure mining, staking and AI trading for global investors." },
    ],
  }),
});

function About() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={<>Building the future of <span className="gradient-text">crypto investing</span></>}
        subtitle="AuraTrad.Ai unifies mining, staking and AI trading into one premium platform — engineered for trust, speed and global reach."
      />
      <Section>
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold">Our mission</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">We believe everyone deserves access to professional-grade crypto investment tools. AuraTrad.Ai simplifies complex financial infrastructure into a single, beautiful dashboard — so you can focus on growing your portfolio.</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Our values</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">Transparency, security and user empowerment are non-negotiable. From cold-storage architecture to real-time reporting, every decision starts with the investor.</p>
          </div>
        </div>
      </Section>
      <Section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { i: <Users />, l: "240k+", s: "Active investors" },
            { i: <Globe />, l: "140+", s: "Countries served" },
            { i: <Shield />, l: "$1.2B", s: "Assets secured" },
            { i: <Award />, l: "99.99%", s: "Uptime SLA" },
          ].map((s) => (
            <GlassCard key={s.l}>
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-3">{s.i}</div>
              <p className="text-3xl font-bold gradient-text">{s.l}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.s}</p>
            </GlassCard>
          ))}
        </div>
      </Section>
    </>
  );
}
