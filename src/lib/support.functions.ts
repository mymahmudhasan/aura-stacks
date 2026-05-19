import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Name = z.string().trim().min(1).max(80);
const Email = z.string().trim().email().max(160).optional().nullable();
const Id = z.string().uuid();
const Body = z.string().trim().min(1).max(4000);

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
      .select("id,status,guest_name,last_message_at")
      .eq("id", data.conversation_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
