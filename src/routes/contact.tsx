import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageSquare, Send, MapPin, Phone, Building2 } from "lucide-react";
import { CTA, GlassCard, PageHero, Section } from "@/components/ui-bits";

const offices = [
  { country: "Bangladesh", flag: "🇧🇩", city: "Dhaka", tag: "Regional HQ — South Asia", address: "Level 14, Bay's Galleria, 57 Gulshan Avenue, Dhaka 1212", phone: "+880 1700 112233" },
  { country: "Singapore", flag: "🇸🇬", city: "Singapore", tag: "Global Headquarters", address: "Marina Bay Financial Centre, Tower 3, #28-01, 12 Marina Boulevard, 018982", phone: "+65 6812 4400" },
  { country: "United Arab Emirates", flag: "🇦🇪", city: "Dubai", tag: "Middle East Hub", address: "Office 3204, Burj Daman Tower, DIFC, Dubai", phone: "+971 4 555 8800" },
  { country: "United Kingdom", flag: "🇬🇧", city: "London", tag: "Europe Hub", address: "Floor 22, The Leadenhall Building, 122 Leadenhall St, London EC3V 4AB", phone: "+44 20 7946 1100" },
  { country: "United States", flag: "🇺🇸", city: "New York", tag: "Americas Hub", address: "Suite 4500, One World Trade Center, 285 Fulton St, New York, NY 10007", phone: "+1 212 555 0144" },
  { country: "Switzerland", flag: "🇨🇭", city: "Zug", tag: "Crypto Valley", address: "Dammstrasse 16, 6300 Zug", phone: "+41 41 511 2200" },
  { country: "Japan", flag: "🇯🇵", city: "Tokyo", tag: "APAC Operations", address: "Roppongi Hills Mori Tower 31F, 6-10-1 Roppongi, Minato-ku, Tokyo 106-6131", phone: "+81 3 6406 5500" },
  { country: "Australia", flag: "🇦🇺", city: "Sydney", tag: "Oceania Office", address: "Level 38, International Tower One, 100 Barangaroo Avenue, Sydney NSW 2000", phone: "+61 2 8001 6600" },
];

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
