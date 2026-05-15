import { createServerFn } from "@tanstack/react-start";
import { randomInt } from "crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TWILIO_GATEWAY = "https://connector-gateway.lovable.dev/twilio";

const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, "Phone must be in E.164 format, e.g. +14155552671");

export const sendTestSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phone: string }) =>
    z.object({ phone: phoneSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Admin-only to prevent abuse / billing surprises
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return {
        ok: false as const,
        stage: "auth" as const,
        message: "Admin role required to use the SMS test tool.",
      };
    }

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
    const FROM = process.env.TWILIO_FROM_NUMBER;
    const MSID = process.env.TWILIO_MESSAGING_SERVICE_SID;

    const env = {
      LOVABLE_API_KEY: !!LOVABLE_API_KEY,
      TWILIO_API_KEY: !!TWILIO_API_KEY,
      TWILIO_FROM_NUMBER: !!FROM,
      TWILIO_MESSAGING_SERVICE_SID: !!MSID,
    };

    if (!LOVABLE_API_KEY) {
      return { ok: false as const, stage: "config" as const, env, message: "LOVABLE_API_KEY missing." };
    }
    if (!TWILIO_API_KEY) {
      return {
        ok: false as const,
        stage: "config" as const,
        env,
        message: "Twilio is not connected. Connect Twilio in Lovable Cloud → Connectors.",
      };
    }
    if (!FROM && !MSID) {
      return {
        ok: false as const,
        stage: "config" as const,
        env,
        message: "Set TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID in project secrets.",
      };
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const params = new URLSearchParams({
      To: data.phone,
      Body: `NovaTrad.Ai test code: ${code} (test only — do not share).`,
    });
    if (MSID) params.set("MessagingServiceSid", MSID);
    else if (FROM) params.set("From", FROM);

    const t0 = Date.now();
    const res = await fetch(`${TWILIO_GATEWAY}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const latency_ms = Date.now() - t0;
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      return {
        ok: false as const,
        stage: "twilio" as const,
        env,
        latency_ms,
        status: res.status,
        message:
          (body.message as string | undefined) ??
          `Twilio rejected the request (HTTP ${res.status}).`,
        twilioCode: body.code as number | undefined,
        moreInfo: body.more_info as string | undefined,
      };
    }

    return {
      ok: true as const,
      stage: "sent" as const,
      env,
      latency_ms,
      sid: body.sid as string | undefined,
      status: body.status as string | undefined,
      to: body.to as string | undefined,
      from: body.from as string | undefined,
      // Echo the code so the admin can confirm receipt against what was sent
      sentCode: code,
    };
  });
