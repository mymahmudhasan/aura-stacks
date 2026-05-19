import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Name = z.string().trim().min(1).max(80);
const Email = z.string().trim().email().max(160).optional().nullable();
const Id = z.string().uuid();
const Body = z.string().trim().min(1).max(4000);

async function ensureTicketForConversation(conversationId: string, firstBody?: string) {
  const { data: conv, error: cErr } = await supabaseAdmin
    .from("support_conversations")
    .select("id,user_id,guest_name,guest_email,ticket_id")
    .eq("id", conversationId)
    .single();
  if (cErr) throw new Error(cErr.message);
  if (conv.ticket_id) return conv.ticket_id as string;

  const subject = (firstBody ?? "").slice(0, 100) || `Live chat — ${conv.guest_name}`;
  const message = (firstBody ?? "").slice(0, 4000) || "Live chat conversation started.";
  const email = conv.guest_email && conv.guest_email.includes("@")
    ? conv.guest_email
    : `livechat+${conversationId}@auratrad.ai`;

  const { data: ticket, error: tErr } = await supabaseAdmin
    .from("tickets")
    .insert({
      full_name: conv.guest_name,
      email,
      category: "general",
      priority: "normal",
      subject,
      message,
      user_id: conv.user_id ?? null,
      source: "live_chat",
      source_conversation_id: conversationId,
    })
    .select("id")
    .single();
  if (tErr) throw new Error(tErr.message);

  await supabaseAdmin
    .from("support_conversations")
    .update({ ticket_id: ticket.id })
    .eq("id", conversationId);

  return ticket.id as string;
}

export const startSupportChat = createServerFn({ method: "POST" })
  .inputValidator((i) =>
    z
      .object({
        guest_name: Name,
        guest_email: Email,
        user_id: z.string().uuid().optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("support_conversations")
      .insert({
        guest_name: data.guest_name,
        guest_email: data.guest_email ?? null,
        user_id: data.user_id ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const sendSupportMessage = createServerFn({ method: "POST" })
  .inputValidator((i) =>
    z
      .object({
        conversation_id: Id,
        body: Body,
        author_name: Name,
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    // Ensure a ticket exists for this conversation (uses first message as subject)
    const ticketId = await ensureTicketForConversation(data.conversation_id, data.body);

    const { data: msg, error } = await supabaseAdmin
      .from("support_messages")
      .insert({
        conversation_id: data.conversation_id,
        sender: "user",
        author_name: data.author_name,
        body: data.body,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    // Mirror to ticket thread so admins can see the full convo from Tickets tab.
    await supabaseAdmin.from("ticket_messages").insert({
      ticket_id: ticketId,
      author_id: null,
      author_name: data.author_name,
      is_staff: false,
      body: data.body,
    });
    await supabaseAdmin
      .from("tickets")
      .update({ updated_at: new Date().toISOString(), status: "open" })
      .eq("id", ticketId);

    // Broadcast so the admin (and any other listener on this channel) gets it instantly.
    const channel = supabaseAdmin.channel(`support:${data.conversation_id}`);
    await new Promise<void>((resolve) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") resolve();
      });
      setTimeout(resolve, 1500);
    });
    await channel.send({ type: "broadcast", event: "message", payload: msg });
    await supabaseAdmin.removeChannel(channel);

    return msg;
  });

export const getSupportMessages = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ conversation_id: Id }).parse(i))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("support_messages")
      .select("*")
      .eq("conversation_id", data.conversation_id)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getSupportConversation = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ conversation_id: Id }).parse(i))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("support_conversations")
      .select("id,status,guest_name,last_message_at,ticket_id")
      .eq("id", data.conversation_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const ensureChatTicket = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ conversation_id: Id }).parse(i))
  .handler(async ({ data }) => {
    const ticketId = await ensureTicketForConversation(data.conversation_id);
    return { ticket_id: ticketId };
  });

/* ----- Admin: ticket thread + reply ----- */

export const getTicketThread = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ ticket_id: Id }).parse(i))
  .handler(async ({ data }) => {
    const [{ data: ticket }, { data: messages }] = await Promise.all([
      supabaseAdmin.from("tickets").select("*").eq("id", data.ticket_id).maybeSingle(),
      supabaseAdmin
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", data.ticket_id)
        .order("created_at", { ascending: true })
        .limit(500),
    ]);
    return { ticket, messages: messages ?? [] };
  });

export const replyToTicket = createServerFn({ method: "POST" })
  .inputValidator((i) =>
    z
      .object({
        ticket_id: Id,
        body: Body,
        author_name: Name,
        author_id: z.string().uuid().optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { data: msg, error } = await supabaseAdmin
      .from("ticket_messages")
      .insert({
        ticket_id: data.ticket_id,
        author_id: data.author_id ?? null,
        author_name: data.author_name,
        is_staff: true,
        body: data.body,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("tickets")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", data.ticket_id);

    // If this ticket has a linked live chat, mirror the reply into the chat too.
    const { data: conv } = await supabaseAdmin
      .from("support_conversations")
      .select("id")
      .eq("ticket_id", data.ticket_id)
      .maybeSingle();

    if (conv) {
      const { data: chatMsg } = await supabaseAdmin
        .from("support_messages")
        .insert({
          conversation_id: conv.id,
          sender: "admin",
          author_name: data.author_name,
          body: data.body,
        })
        .select("*")
        .single();

      if (chatMsg) {
        const channel = supabaseAdmin.channel(`support:${conv.id}`);
        await new Promise<void>((resolve) => {
          channel.subscribe((status) => {
            if (status === "SUBSCRIBED") resolve();
          });
          setTimeout(resolve, 1500);
        });
        await channel.send({ type: "broadcast", event: "message", payload: chatMsg });
        await supabaseAdmin.removeChannel(channel);
      }
    }

    return msg;
  });
