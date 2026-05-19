import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Send, X, MessageCircle, Loader2, Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  startSupportChat,
  sendSupportMessage,
  getSupportMessages,
} from "@/lib/support.functions";

type Msg = {
  id: string;
  conversation_id: string;
  sender: "user" | "admin";
  author_name: string;
  body: string;
  created_at: string;
};

const LS_KEY = "auratrad.support.chat";

type Stored = { conversationId: string; name: string; email: string | null };

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

const PRESETS = [
  "I need help with my deposit / withdrawal",
  "My AI bot status — can you check?",
  "Question about mining or staking plans",
  "I want to talk to a human investment advisor",
];

const BOT_NAME = "AuraBot";
const MAX_BOT_REPLIES = 2;

function botReplyFor(text: string): string | null {
  const t = text.toLowerCase();
  if (/(deposit|withdraw|payout|payment|transfer)/.test(t)) {
    return "Got it 👍 For deposits/withdrawals: please share your transaction hash (TXID) and the wallet/network used. Deposits credit after network confirmations (BTC ~3, ETH/BNB ~12). Withdrawals are processed within 24h after KYC review. An agent will jump in shortly to verify your case.";
  }
  if (/(bot|ai|trading|signal|strategy)/.test(t)) {
    return "Thanks! Our AI trading bot runs 24/7 with risk-controlled positions. If it looks paused, it's usually because the market filter detected high volatility and paused entries — this is normal. Please share your account email or plan name so an agent can pull your bot logs.";
  }
  if (/(min|stak|plan|package|roi|earn|reward)/.test(t)) {
    return "Sure — mining & staking plans pay daily into your wallet balance and unlock on maturity. You can view active plans in Dashboard → Plans. Tell me which plan you're asking about (name or amount) and an agent will confirm your exact schedule.";
  }
  if (/(human|agent|advisor|person|representative|real)/.test(t)) {
    return "Connecting you with a human advisor now 🧑‍💼 — usual response time is a few minutes. While you wait, please share the topic in 1-2 sentences so the agent can help faster.";
  }
  if (/(kyc|verify|verification|id|passport|document)/.test(t)) {
    return "For KYC: upload a government ID + selfie under Settings → Verification. Approvals usually take under 1 hour during business time. An agent will confirm your status here.";
  }
  if (/(password|login|reset|2fa|otp|sign in|signin|access)/.test(t)) {
    return "For login/2FA issues: try Forgot Password, and make sure your device time is correct for OTP codes. If still locked out, share your account email and an agent will assist.";
  }
  if (/(referr|affiliate|commission|invite)/.test(t)) {
    return "Affiliate rewards pay instantly when your referral funds a plan. Your referral link is on the Affiliate page. An agent can audit any missing commissions for you.";
  }
  if (/(hi|hello|hey|hola|salam|assalam)/.test(t.trim())) {
    return "Hi! 👋 Quick question so I can route you faster — is this about deposits/withdrawals, your AI bot, a mining/staking plan, or your account login?";
  }
  return "Thanks for the details ✍️ — I've logged this and a human agent is being notified now. They'll reply right in this chat within a few minutes.";
}

export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [stored, setStored] = useState<Stored | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [authUser, setAuthUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const autoStartedRef = useRef(false);
  const botRepliesRef = useRef(0);
  const humanRepliedRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setStored(readStored());
  }, []);

  useEffect(() => {
    let active = true;

    const load = async (uid: string | null, mail: string | null) => {
      if (!uid) {
        if (active) {
          setAuthUser(null);
          setAuthChecked(true);
        }
        return;
      }
      const { data: cust } = await supabase
        .from("customers")
        .select("full_name")
        .eq("user_id", uid)
        .maybeSingle();
      if (!active) return;
      const display =
        (cust?.full_name && cust.full_name.trim()) ||
        (mail ? mail.split("@")[0] : "Member");
      setAuthUser({ id: uid, email: mail ?? "", name: display });
      setAuthChecked(true);
    };

    supabase.auth.getUser().then(({ data }) => {
      void load(data.user?.id ?? null, data.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
        autoStartedRef.current = false;
        setStored(null);
        setMessages([]);
      }
      void load(session?.user?.id ?? null, session?.user?.email ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Auto-start a conversation for signed-in users so they never see the form.
  useEffect(() => {
    if (!authChecked || !authUser || stored || autoStartedRef.current) return;
    autoStartedRef.current = true;
    (async () => {
      try {
        const { id } = await startSupportChat({
          data: {
            guest_name: authUser.name,
            guest_email: authUser.email || null,
            user_id: authUser.id,
          },
        });
        const next: Stored = {
          conversationId: id,
          name: authUser.name,
          email: authUser.email || null,
        };
        try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* noop */ }
        setStored(next);
      } catch {
        autoStartedRef.current = false;
      }
    })();
  }, [authChecked, authUser, stored]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  useEffect(() => {
    if (!stored) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await getSupportMessages({
          data: { conversation_id: stored.conversationId },
        });
        if (!cancelled) setMessages(rows as Msg[]);
      } catch {
        /* ignore */
      }
    })();

    const channel = supabase
      .channel(`support:${stored.conversationId}`)
      .on("broadcast", { event: "message" }, (payload) => {
        const msg = payload.payload as Msg;
        if (msg.sender === "admin") humanRepliedRef.current = true;
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
        );
        if (msg.sender === "admin" && !open) setUnread((n) => n + 1);
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [stored, open]);

  useEffect(() => {
    if (open) setUnread(0);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    setListening(false);
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { stopListening(); return; }
    const rec = new SR();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    baseTextRef.current = body ? body.trimEnd() + " " : "";
    rec.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setBody(baseTextRef.current + transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  };

  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch { /* noop */ } }, []);

  const onStart = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      if (trimmedName.length < 1) return setError("Please enter your name.");
      if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
        return setError("Please enter a valid email.");

      setBusy(true);
      try {
        const { data: sess } = await supabase.auth.getSession();
        const { id } = await startSupportChat({
          data: {
            guest_name: trimmedName,
            guest_email: trimmedEmail || null,
            user_id: sess.session?.user.id ?? null,
          },
        });
        const next: Stored = {
          conversationId: id,
          name: trimmedName,
          email: trimmedEmail || null,
        };
        localStorage.setItem(LS_KEY, JSON.stringify(next));
        setStored(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not start chat.");
      } finally {
        setBusy(false);
      }
    },
    [name, email],
  );

  const sendText = useCallback(
    async (text: string) => {
      if (!stored) return;
      const clean = text.trim();
      if (!clean) return;
      setBusy(true);
      setError(null);
      try {
        const msg = await sendSupportMessage({
          data: {
            conversation_id: stored.conversationId,
            body: clean,
            author_name: stored.name,
          },
        });
        setMessages((prev) =>
          prev.some((m) => m.id === (msg as Msg).id) ? prev : [...prev, msg as Msg],
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Send failed.");
      } finally {
        setBusy(false);
      }
    },
    [stored],
  );

  const onSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      stopListening();
      const text = body;
      setBody("");
      await sendText(text);
    },
    [body, sendText],
  );

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-[60] w-[340px] max-w-[calc(100vw-2.5rem)] glass-strong rounded-2xl border border-primary/30 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-4 py-3 bg-primary/15 border-b border-primary/30">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-primary/30 text-primary flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
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

          {!stored ? (
            authUser || !authChecked ? (
              <div className="p-8 flex items-center justify-center bg-card/30">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
            <form onSubmit={onStart} className="p-4 space-y-3 bg-card/30">
              <p className="text-xs text-muted-foreground">
                Start a chat with a real agent. Replies appear here instantly.
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                maxLength={80}
                className="w-full px-3 py-2 rounded-lg bg-input/50 border border-border focus:border-primary outline-none text-xs"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional, for follow-up)"
                maxLength={160}
                className="w-full px-3 py-2 rounded-lg bg-input/50 border border-border focus:border-primary outline-none text-xs"
              />
              {error && <p className="text-[11px] text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                Start live chat
              </button>
            </form>
            )
          ) : (
            <>
              <div
                ref={scrollRef}
                className="px-4 py-3 space-y-3 bg-card/30 max-h-[360px] overflow-y-auto"
              >
                <div className="rounded-xl rounded-tl-sm bg-white/5 px-3 py-2.5 text-xs text-foreground/90 leading-relaxed">
                  👋 Hi {stored.name.split(" ")[0]}! I'm here to help with
                  deposits, withdrawals, AI bot issues or any account question.
                  Pick a topic, type, or tap the mic to speak — a real agent
                  will reply right here.
                </div>

                {messages.length === 0 && (
                  <div className="space-y-1.5">
                    {PRESETS.map((p) => (
                      <button
                        key={p}
                        onClick={() => sendText(p)}
                        disabled={busy}
                        className="w-full text-left text-xs px-3 py-2 rounded-lg glass hover:border-primary/40 transition disabled:opacity-50"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                        m.sender === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-white/5 border border-border rounded-bl-sm"
                      }`}
                    >
                      {m.sender === "admin" && (
                        <p className="text-[10px] font-semibold text-primary mb-0.5">
                          {m.author_name || "Support"}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={onSend} className="flex items-center gap-2 p-3 border-t border-border bg-card/50">
                <input
                  type="text"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={listening ? "Listening…" : "Type or tap mic to speak…"}
                  maxLength={4000}
                  className="flex-1 px-3 py-2 rounded-lg bg-input/50 border border-border focus:border-primary outline-none text-xs"
                />
                {speechSupported ? (
                  <button
                    type="button"
                    onClick={startListening}
                    aria-label={listening ? "Stop voice input" : "Start voice input"}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition ${
                      listening
                        ? "bg-destructive text-white animate-pulse ring-2 ring-destructive/40"
                        : "glass hover:border-primary/40 text-foreground"
                    }`}
                  >
                    {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={busy || !body.trim()}
                  aria-label="Send"
                  className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition shrink-0 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
              <p className="text-[10px] text-muted-foreground text-center pb-2">
                {listening ? "🎙️ Listening — speak now" : "Live chat with a real agent"}
              </p>
              {error && <p className="px-3 pb-2 text-[10px] text-destructive text-center">{error}</p>}
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open live support chat"
        className="fixed bottom-5 right-5 z-[60] group"
      >
        <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl group-hover:bg-primary/60 transition" />
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        <span className="relative w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl border-2 border-primary/40 hover:scale-105 transition">
          {open ? <X className="w-6 h-6" /> : <Headphones className="w-7 h-7" />}
        </span>
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">
            {unread}
          </span>
        )}
        {!open && (
          <span className="hidden md:flex absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap glass-strong border border-primary/30 px-3 py-1.5 rounded-full text-xs font-medium items-center gap-1.5 shadow-lg">
            <MessageCircle className="w-3.5 h-3.5 text-primary" />
            Live chat — real agent
          </span>
        )}
      </button>
    </>
  );
}
