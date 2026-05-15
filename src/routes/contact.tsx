import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageSquare, Send, MapPin, Phone, Building2, Languages } from "lucide-react";
import { CTA, GlassCard, PageHero, Section } from "@/components/ui-bits";

type Lang = "en" | "bn";

const offices: Record<Lang, Array<{ country: string; flag: string; city: string; tag: string; address: string; phone: string }>> = {
  en: [
    { country: "Bangladesh", flag: "🇧🇩", city: "Dhaka", tag: "Regional HQ — South Asia", address: "Level 14, Bay's Galleria, 57 Gulshan Avenue, Dhaka 1212", phone: "+880 1700 112233" },
    { country: "Singapore", flag: "🇸🇬", city: "Singapore", tag: "Global Headquarters", address: "Marina Bay Financial Centre, Tower 3, #28-01, 12 Marina Boulevard, 018982", phone: "+65 6812 4400" },
    { country: "United Arab Emirates", flag: "🇦🇪", city: "Dubai", tag: "Middle East Hub", address: "Office 3204, Burj Daman Tower, DIFC, Dubai", phone: "+971 4 555 8800" },
    { country: "United Kingdom", flag: "🇬🇧", city: "London", tag: "Europe Hub", address: "Floor 22, The Leadenhall Building, 122 Leadenhall St, London EC3V 4AB", phone: "+44 20 7946 1100" },
    { country: "United States", flag: "🇺🇸", city: "New York", tag: "Americas Hub", address: "Suite 4500, One World Trade Center, 285 Fulton St, New York, NY 10007", phone: "+1 212 555 0144" },
    { country: "Switzerland", flag: "🇨🇭", city: "Zug", tag: "Crypto Valley", address: "Dammstrasse 16, 6300 Zug", phone: "+41 41 511 2200" },
    { country: "Japan", flag: "🇯🇵", city: "Tokyo", tag: "APAC Operations", address: "Roppongi Hills Mori Tower 31F, 6-10-1 Roppongi, Minato-ku, Tokyo 106-6131", phone: "+81 3 6406 5500" },
    { country: "Australia", flag: "🇦🇺", city: "Sydney", tag: "Oceania Office", address: "Level 38, International Tower One, 100 Barangaroo Avenue, Sydney NSW 2000", phone: "+61 2 8001 6600" },
  ],
  bn: [
    { country: "বাংলাদেশ", flag: "🇧🇩", city: "ঢাকা", tag: "আঞ্চলিক সদর দপ্তর — দক্ষিণ এশিয়া", address: "লেভেল ১৪, বে'স গ্যালেরিয়া, ৫৭ গুলশান এভিনিউ, ঢাকা ১২১২", phone: "+৮৮০ ১৭০০ ১১২২৩৩" },
    { country: "সিঙ্গাপুর", flag: "🇸🇬", city: "সিঙ্গাপুর", tag: "গ্লোবাল সদর দপ্তর", address: "মেরিনা বে ফাইন্যান্সিয়াল সেন্টার, টাওয়ার ৩, #২৮-০১, ১২ মেরিনা বুলেভার্ড, ০১৮৯৮২", phone: "+৬৫ ৬৮১২ ৪৪০০" },
    { country: "সংযুক্ত আরব আমিরাত", flag: "🇦🇪", city: "দুবাই", tag: "মধ্যপ্রাচ্য কেন্দ্র", address: "অফিস ৩২০৪, বুর্জ দামান টাওয়ার, ডিআইএফসি, দুবাই", phone: "+৯৭১ ৪ ৫৫৫ ৮৮০০" },
    { country: "যুক্তরাজ্য", flag: "🇬🇧", city: "লন্ডন", tag: "ইউরোপ কেন্দ্র", address: "ফ্লোর ২২, দ্য লিডেনহল বিল্ডিং, ১২২ লিডেনহল স্ট্রিট, লন্ডন EC3V 4AB", phone: "+৪৪ ২০ ৭৯৪৬ ১১০০" },
    { country: "যুক্তরাষ্ট্র", flag: "🇺🇸", city: "নিউ ইয়র্ক", tag: "আমেরিকা কেন্দ্র", address: "স্যুট ৪৫০০, ওয়ান ওয়ার্ল্ড ট্রেড সেন্টার, ২৮৫ ফুলটন স্ট্রিট, নিউ ইয়র্ক, NY 10007", phone: "+১ ২১২ ৫৫৫ ০১৪৪" },
    { country: "সুইজারল্যান্ড", flag: "🇨🇭", city: "জুগ", tag: "ক্রিপ্টো ভ্যালি", address: "ড্যামস্ট্রাসে ১৬, ৬৩০০ জুগ", phone: "+৪১ ৪১ ৫১১ ২২০০" },
    { country: "জাপান", flag: "🇯🇵", city: "টোকিও", tag: "এপিএসি অপারেশনস", address: "রপ্পংগি হিলস মোরি টাওয়ার ৩১তলা, ৬-১০-১ রপ্পংগি, মিনাতো-কু, টোকিও ১০৬-৬১৩১", phone: "+৮১ ৩ ৬৪০৬ ৫৫০০" },
    { country: "অস্ট্রেলিয়া", flag: "🇦🇺", city: "সিডনি", tag: "ওশেনিয়া অফিস", address: "লেভেল ৩৮, ইন্টারন্যাশনাল টাওয়ার ওয়ান, ১০০ বারাঙ্গারু এভিনিউ, সিডনি NSW 2000", phone: "+৬১ ২ ৮০০১ ৬৬০০" },
  ],
};

const t = {
  en: {
    heroEyebrow: "Contact",
    heroTitle: <>We're here to <span className="gradient-text">help, 24/7</span></>,
    heroSubtitle: "Reach our team via email or join our global community on Telegram and Discord.",
    sendTitle: "Send us a message",
    name: "Your name",
    email: "Email",
    message: "How can we help?",
    send: "Send message",
    emailLabel: "Email",
    telegramLabel: "Telegram",
    discordLabel: "Discord",
    faq: "Browse FAQ",
    presenceEyebrow: "Global Presence",
    presenceTitle: <>Offices across <span className="gradient-text">8 countries</span></>,
    presenceSubtitle: "Local teams, global reach. Visit us or reach our regional desks during business hours.",
  },
  bn: {
    heroEyebrow: "যোগাযোগ",
    heroTitle: <>আমরা <span className="gradient-text">২৪/৭ সহায়তায়</span> আছি</>,
    heroSubtitle: "ইমেইলে আমাদের দলের সাথে যোগাযোগ করুন বা টেলিগ্রাম ও ডিসকর্ডে আমাদের গ্লোবাল কমিউনিটিতে যোগ দিন।",
    sendTitle: "আমাদের একটি বার্তা পাঠান",
    name: "আপনার নাম",
    email: "ইমেইল",
    message: "আমরা কীভাবে সাহায্য করতে পারি?",
    send: "বার্তা পাঠান",
    emailLabel: "ইমেইল",
    telegramLabel: "টেলিগ্রাম",
    discordLabel: "ডিসকর্ড",
    faq: "প্রশ্নোত্তর দেখুন",
    presenceEyebrow: "বৈশ্বিক উপস্থিতি",
    presenceTitle: <>৮টি দেশে <span className="gradient-text">আমাদের অফিস</span></>,
    presenceSubtitle: "স্থানীয় দল, বৈশ্বিক পরিসর। অফিস চলাকালীন সময়ে আমাদের আঞ্চলিক ডেস্কে আসুন বা যোগাযোগ করুন।",
  },
};

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "Contact — AuraTrad.Ai" },
      { name: "description", content: "Get in touch with AuraTrad.Ai — 24/7 support across email, Telegram and Discord." },
    ],
  }),
});

function Contact() {
  const [lang, setLang] = useState<Lang>("en");
  const c = t[lang];
  const list = offices[lang];

  return (
    <>
      <PageHero eyebrow={c.heroEyebrow} title={c.heroTitle} subtitle={c.heroSubtitle} />

      <div className="mx-auto max-w-7xl px-5 pt-8 flex justify-end">
        <div className="inline-flex items-center gap-1 p-1 rounded-full glass">
          <Languages className="w-4 h-4 ml-2 text-primary" />
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            English
          </button>
          <button
            onClick={() => setLang("bn")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${lang === "bn" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            বাংলা
          </button>
        </div>
      </div>

      <Section>
        <div className="grid lg:grid-cols-2 gap-8">
          <GlassCard>
            <h3 className="text-xl font-semibold mb-4">{c.sendTitle}</h3>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <input type="text" placeholder={c.name} className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
              <input type="email" placeholder={c.email} className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none" />
              <textarea rows={5} placeholder={c.message} className="w-full px-4 py-3 rounded-xl bg-input/50 border border-border focus:border-primary outline-none resize-none" />
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium glow-primary">
                <Send className="w-4 h-4" /> {c.send}
              </button>
            </form>
          </GlassCard>
          <div className="space-y-5">
            <GlassCard>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><Mail /></div>
                <div><p className="text-sm text-muted-foreground">{c.emailLabel}</p><p className="font-medium">support@novavault.io</p></div>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><MessageSquare /></div>
                <div><p className="text-sm text-muted-foreground">{c.telegramLabel}</p><p className="font-medium">t.me/novavault</p></div>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><MessageSquare /></div>
                <div><p className="text-sm text-muted-foreground">{c.discordLabel}</p><p className="font-medium">discord.gg/novavault</p></div>
              </div>
            </GlassCard>
            <CTA to="/faq" variant="ghost" className="w-full justify-center">{c.faq}</CTA>
          </div>
        </div>
      </Section>

      <Section eyebrow={c.presenceEyebrow} title={c.presenceTitle} subtitle={c.presenceSubtitle}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {list.map((o) => (
            <GlassCard key={o.country} className="hover:border-primary/30 transition">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl leading-none" aria-hidden>{o.flag}</span>
                  <div>
                    <p className="font-semibold leading-tight">{o.city}</p>
                    <p className="text-xs text-muted-foreground">{o.country}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                  <Building2 className="w-2.5 h-2.5 inline -mt-0.5 mr-1" />{o.tag.split("—")[0].trim()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <span>{o.address}</span>
              </p>
              <p className="text-xs font-mono flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-primary" />{o.phone}
              </p>
            </GlassCard>
          ))}
        </div>
      </Section>
    </>
  );
}
