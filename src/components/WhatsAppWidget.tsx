import { useEffect, useState } from "react";
import { X, MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Fallback used only if the database setting hasn't loaded yet.
const FALLBACK_WA_NUMBER = "14155551234";
const EVENT = "novatrad:whatsapp-number-changed";

function WhatsAppIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.495-1.318.115-.27.143-.56.143-.846 0-.6-1.65-1.347-1.61-1.347zm-2.85 6.43h-.025a9.852 9.852 0 0 1-5-1.376l-.358-.214-3.715.975 1-3.624-.236-.373a9.812 9.812 0 0 1-1.5-5.215c.005-5.42 4.42-9.83 9.85-9.83 2.62 0 5.087 1.024 6.943 2.882a9.776 9.776 0 0 1 2.876 6.952c-.003 5.42-4.418 9.823-9.835 9.823zm8.378-18.214A11.806 11.806 0 0 0 16.262 2C9.74 2 4.43 7.31 4.426 13.835c0 2.086.546 4.124 1.583 5.918L4.327 26l6.4-1.68a11.793 11.793 0 0 0 5.638 1.434h.005c6.522 0 11.831-5.31 11.834-11.836a11.769 11.769 0 0 0-3.465-8.497z" />
    </svg>
  );
}

export function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [number, setNumber] = useState(FALLBACK_WA_NUMBER);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("whatsapp_number")
        .eq("id", 1)
        .maybeSingle();
      if (!cancelled && data?.whatsapp_number) setNumber(data.whatsapp_number);
    };
    load();
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string" && detail) setNumber(detail);
    };
    window.addEventListener(EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, onChange);
    };
  }, []);

  const greeting =
    "Hi AuraTrad.Ai support 👋 — I have a question about my account / investment.";

  const sendOnWhatsApp = (text: string) => {
    const url = `https://wa.me/${number}?text=${encodeURIComponent(text || greeting)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const presets = [
    "I need help with my deposit / withdrawal",
    "My AI bot status — can you check?",
    "Question about mining or staking plans",
    "I want to talk to a human investment advisor",
  ];

  return (
    <>
      {/* Floating chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[60] w-[340px] max-w-[calc(100vw-2.5rem)] glass-strong rounded-2xl border border-success/30 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-success/15 border-b border-success/30">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-success/30 text-success flex items-center justify-center">
                  <WhatsAppIcon className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-background animate-pulse" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">AuraTrad.Ai Support</p>
                <p className="text-[11px] text-success">Online · replies in minutes</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 bg-card/30">
            <div className="rounded-xl rounded-tl-sm bg-white/5 px-3 py-2.5 text-xs text-foreground/90 leading-relaxed">
              👋 Hi there! I'm here to help with deposits, withdrawals, AI bot
              issues or any account question. Pick a topic or send a message —
              we'll continue on WhatsApp.
            </div>

            <div className="space-y-1.5">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => sendOnWhatsApp(p)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg glass hover:border-success/40 transition"
                >
                  {p}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendOnWhatsApp(message);
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your question…"
                className="flex-1 px-3 py-2 rounded-lg bg-input/50 border border-border focus:border-success outline-none text-xs"
              />
              <button
                type="submit"
                aria-label="Send on WhatsApp"
                className="w-9 h-9 rounded-lg bg-success text-white flex items-center justify-center hover:opacity-90 transition shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <p className="text-[10px] text-muted-foreground text-center pt-1">
              Opens in WhatsApp · end-to-end encrypted
            </p>
          </div>
        </div>
      )}

      {/* Floating launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-5 right-5 z-[60] group"
      >
        <span className="absolute inset-0 rounded-full bg-success/40 blur-xl group-hover:bg-success/60 transition" />
        <span className="absolute inset-0 rounded-full bg-success/30 animate-ping" />
        <span className="relative w-14 h-14 rounded-full bg-success text-white flex items-center justify-center shadow-2xl border-2 border-success/40 hover:scale-105 transition">
          {open ? <X className="w-6 h-6" /> : <WhatsAppIcon className="w-7 h-7" />}
        </span>
        {!open && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">
            1
          </span>
        )}
        {!open && (
          <span className="hidden md:flex absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap glass-strong border border-success/30 px-3 py-1.5 rounded-full text-xs font-medium items-center gap-1.5 shadow-lg">
            <MessageCircle className="w-3.5 h-3.5 text-success" />
            Need help? Chat live
          </span>
        )}
      </button>
    </>
  );
}
