import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, MessageSquareText, CheckCircle2, RefreshCw, Ticket as TicketIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ensureChatTicket, replyToTicket } from "@/lib/support.functions";

type Conversation = Tables<"support_conversations">;
type Message = Tables<"support_messages">;
type Ticket = Tables<"tickets">;

export function AdminLiveChatTab({ adminName }: { adminName: string }) {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ticket, setTicket] = useState<Pick<Ticket, "id" | "ticket_number"> | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const ensureTicketFn = useServerFn(ensureChatTicket);
  const replyFn = useServerFn(replyToTicket);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setAdminId(data.user?.id ?? null));
  }, []);


  const loadConvs = useCallback(async () => {
    const { data } = await supabase
      .from("support_conversations")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(100);
    setConvs((data ?? []) as Conversation[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadConvs();
    const channel = supabase
      .channel("admin-support-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_conversations" },
        () => void loadConvs(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConvs]);

  const loadMessages = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Message[]);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setTicket(null);
      return;
    }
    void loadMessages(selectedId);

    void (async () => {
      try {
        const { ticket_id } = await ensureTicketFn({ data: { conversation_id: selectedId } });
        const { data: t } = await supabase
          .from("tickets")
          .select("id,ticket_number")
          .eq("id", ticket_id)
          .maybeSingle();
        if (t) setTicket(t as { id: string; ticket_number: string });
      } catch {
        setTicket(null);
      }
    })();

    const pgChannel = supabase
      .channel(`admin-msgs:${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${selectedId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pgChannel);
    };
  }, [selectedId, loadMessages, ensureTicketFn]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const onSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedId) return;
      const text = body.trim();
      if (!text) return;
      setSending(true);
      setBody("");
      try {
        const { ticket_id } = await ensureTicketFn({
          data: { conversation_id: selectedId },
        });
        await replyFn({
          data: {
            ticket_id,
            body: text,
            author_name: adminName || "Support",
            author_id: adminId ?? null,
          },
        });
        // postgres_changes listener will append the new message
      } catch {
        setBody(text);
      } finally {
        setSending(false);
      }
    },
    [body, selectedId, adminName, adminId, ensureTicketFn, replyFn],
  );


  const closeConv = useCallback(async () => {
    if (!selectedId) return;
    await supabase.from("support_conversations").update({ status: "closed" }).eq("id", selectedId);
    void loadConvs();
  }, [selectedId, loadConvs]);

  const selected = useMemo(
    () => convs.find((c) => c.id === selectedId) ?? null,
    [convs, selectedId],
  );

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4 min-h-[60vh]">
      {/* Conversation list */}
      <div className="glass rounded-2xl p-3 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-sm font-semibold">Conversations</h3>
          <button
            onClick={() => void loadConvs()}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : convs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-10">No chats yet.</p>
        ) : (
          <ul className="space-y-1">
            {convs.map((c) => {
              const active = c.id === selectedId;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition ${
                      active
                        ? "bg-primary/15 border-primary/40"
                        : "border-transparent hover:border-primary/30 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{c.guest_name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          c.status === "open"
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    {c.guest_email && (
                      <p className="text-[10px] text-muted-foreground truncate">{c.guest_email}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(c.last_message_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Thread */}
      <div className="glass rounded-2xl flex flex-col max-h-[70vh]">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <MessageSquareText className="w-10 h-10 mb-2 opacity-60" />
            <p className="text-sm">Select a conversation to start replying.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <p className="text-sm font-semibold">{selected.guest_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {selected.guest_email ?? "No email"} · started{" "}
                  {new Date(selected.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {ticket && (
                  <span className="text-[11px] px-2 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary inline-flex items-center gap-1.5">
                    <TicketIcon className="w-3 h-3" /> {ticket.ticket_number}
                  </span>
                )}
                {selected.status === "open" && (
                  <button
                    onClick={closeConv}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg glass hover:border-success/40 inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Close
                  </button>
                )}
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {messages.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-10">
                  No messages yet.
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                        m.sender === "admin"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-white/5 border border-border rounded-bl-sm"
                      }`}
                    >
                      <p className="text-[10px] font-semibold mb-0.5 opacity-80">
                        {m.author_name}
                      </p>
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className="text-[9px] opacity-60 mt-1">
                        {new Date(m.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={onSend} className="flex items-center gap-2 p-3 border-t border-border">
              <input
                type="text"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Reply as admin…"
                maxLength={4000}
                className="flex-1 px-3 py-2 rounded-lg bg-input/50 border border-border focus:border-primary outline-none text-xs"
              />
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
