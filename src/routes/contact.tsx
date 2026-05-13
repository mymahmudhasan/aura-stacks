import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageSquare, Send } from "lucide-react";
import { CTA, GlassCard, PageHero, Section } from "@/components/ui-bits";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "Contact — NovaVault" },
      { name: "description", content: "Get in touch with NovaVault — 24/7 support across email, Telegram and Discord." },
    ],
  }),
});

function Contact() {
  return (
    <>
      <PageHero eyebrow="Contact" title={<>We're here to <span className="gradient-text">help, 24/7</span></>} subtitle="Reach our team via email or join our global community on Telegram and Discord." />
      <Section>
        <div className="grid lg:grid-cols-2 gap-8">
          <GlassCard>
            <h3 className="text-xl font-semibold mb-4">Send us a message</h3>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <input type="text" placeholder="Your name" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
              <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
              <textarea rows={5} placeholder="How can we help?" className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none resize-none" />
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary">
                <Send className="w-4 h-4" /> Send message
              </button>
            </form>
          </GlassCard>
          <div className="space-y-5">
            <GlassCard>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><Mail /></div>
                <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">support@novavault.io</p></div>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><MessageSquare /></div>
                <div><p className="text-sm text-muted-foreground">Telegram</p><p className="font-medium">t.me/novavault</p></div>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><MessageSquare /></div>
                <div><p className="text-sm text-muted-foreground">Discord</p><p className="font-medium">discord.gg/novavault</p></div>
              </div>
            </GlassCard>
            <CTA to="/faq" variant="ghost" className="w-full justify-center">Browse FAQ</CTA>
          </div>
        </div>
      </Section>
    </>
  );
}
