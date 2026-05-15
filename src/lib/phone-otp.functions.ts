import { createServerFn } from "@tanstack/react-start";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TWILIO_GATEWAY = "https://connector-gateway.lovable.dev/twilio";
const OTP_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SEC = 30;

const phoneSchema = z
  .string()
  .min(8)
  .max(20)
  .regex(/^\+[1-9]\d{6,14}$/, "Phone must be in E.164 format, e.g. +14155552671");

const hashCode = (code: string, phone: string) =>
  createHash("sha256").update(`${phone}:${code}`).digest("hex");

async function sendTwilioSms(to: string, body: string) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
  if (!TWILIO_API_KEY) {
    throw new Error("Twilio is not connected. Connect Twilio in Lovable Cloud → Connectors.");
  }
  const FROM = process.env.TWILIO_FROM_NUMBER;
  const MSID = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!FROM && !MSID) {
    throw new Error("Set TWILIO_FROM_NUMBER (or TWILIO_MESSAGING_SERVICE_SID) in project secrets.");
  }

  const params = new URLSearchParams({ To: to, Body: body });
  if (MSID) params.set("MessagingServiceSid", MSID);
  else if (FROM) params.set("From", FROM);

  const res = await fetch(`${TWILIO_GATEWAY}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Twilio error [${res.status}]: ${(data as { message?: string }).message ?? JSON.stringify(data)}`,
    );
  }
}

export const sendPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { userId: string; phone: string }) =>
    z.object({ userId: z.string().uuid(), phone: phoneSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    // Resend cooldown
    const { data: recent } = await supabaseAdmin
      .from("phone_otp_codes")
      .select("created_at")
      .eq("user_id", data.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent) {
      const elapsed = (Date.now() - new Date(recent.created_at).getTime()) / 1000;
      if (elapsed < RESEND_COOLDOWN_SEC) {
        throw new Error(
          `Please wait ${Math.ceil(RESEND_COOLDOWN_SEC - elapsed)}s before requesting another code.`,
        );
      }
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const expires_at = new Date(Date.now() + OTP_TTL_MIN * 60_000).toISOString();

    const { error: insErr } = await supabaseAdmin.from("phone_otp_codes").insert({
      user_id: data.userId,
      phone: data.phone,
      code_hash: hashCode(code, data.phone),
      expires_at,
    });
    if (insErr) throw new Error(insErr.message);

    await sendTwilioSms(data.phone, `Your NovaTrad.Ai verification code is ${code}. Expires in ${OTP_TTL_MIN} minutes.`);

    return { sent: true, expires_at };
  });

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { userId: string; phone: string; code: string }) =>
    z
      .object({
        userId: z.string().uuid(),
        phone: phoneSchema,
        code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("phone_otp_codes")
      .select("id, code_hash, attempts, expires_at, consumed_at")
      .eq("user_id", data.userId)
      .eq("phone", data.phone)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("No active code. Please request a new one.");
    if (new Date(row.expires_at).getTime() < Date.now())
      throw new Error("Code expired. Please request a new one.");
    if (row.attempts >= MAX_ATTEMPTS)
      throw new Error("Too many attempts. Please request a new code.");

    const expected = Buffer.from(row.code_hash, "hex");
    const actual = Buffer.from(hashCode(data.code, data.phone), "hex");
    const ok = expected.length === actual.length && timingSafeEqual(expected, actual);

    if (!ok) {
      await supabaseAdmin
        .from("phone_otp_codes")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      throw new Error("Invalid code.");
    }

    await supabaseAdmin
      .from("phone_otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);

    await supabaseAdmin
      .from("customers")
      .update({ phone: data.phone, phone_verified_at: new Date().toISOString() })
      .eq("user_id", data.userId);

    return { verified: true };
  });
