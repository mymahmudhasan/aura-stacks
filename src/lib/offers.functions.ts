import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export type OfferRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  badge: string | null;
  cta_label: string;
  type: "welcome_boost" | "vip_lock" | "double_rewards" | "referral_bonus";
  effect: Json;
  duration_days: number | null;
  min_amount: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  sort_order: number;
};

export type UserOfferRow = {
  id: string;
  offer_slug: string;
  status: "active" | "expired" | "used" | "pending_approval";
  claimed_at: string;
  expires_at: string | null;
  applied_to_investment_id: string | null;
  payload: Json;
};


async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const listOffers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("offers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as OfferRow[];
});

export const getMyOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [offersRes, userOffersRes, bonusesRes] = await Promise.all([
      supabaseAdmin.from("offers").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
      supabase.from("user_offers").select("*").eq("user_id", userId),
      supabase.from("referral_bonuses").select("id,amount,status,referred_handle,created_at,paid_at").eq("referrer_id", userId).order("created_at", { ascending: false }),
    ]);
    if (offersRes.error) throw new Error(offersRes.error.message);
    return {
      offers: (offersRes.data ?? []) as OfferRow[],
      claims: (userOffersRes.data ?? []) as UserOfferRow[],
      referralBonuses: bonusesRes.data ?? [],
    };
  });

export const claimOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(64) }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: offer, error } = await supabaseAdmin
      .from("offers").select("*").eq("slug", data.slug).eq("is_active", true).maybeSingle();
    if (error) throw new Error(error.message);
    if (!offer) throw new Error("Offer not available");

    const { data: existing } = await supabaseAdmin
      .from("user_offers").select("id,status").eq("user_id", userId).eq("offer_slug", data.slug).maybeSingle();
    if (existing && existing.status === "active") return { ok: true, already: true };

    const expires_at = offer.duration_days
      ? new Date(Date.now() + offer.duration_days * 86400000).toISOString()
      : null;

    const { error: upErr } = await supabaseAdmin
      .from("user_offers")
      .upsert({
        user_id: userId,
        offer_slug: data.slug,
        status: "active",
        claimed_at: new Date().toISOString(),
        expires_at,
        payload: {},
      }, { onConflict: "user_id,offer_slug" });
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });

export const goVipInvest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ amount: z.number().min(5000).max(10_000_000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: cust } = await supabase
      .from("customers").select("balance").eq("user_id", userId).maybeSingle();
    if (!cust || Number(cust.balance) < data.amount) throw new Error("Insufficient balance — deposit first");

    const started = new Date();
    const ends = new Date(started.getTime() + 365 * 86400000);

    const { data: inv, error } = await supabaseAdmin
      .from("investments")
      .insert({
        user_id: userId,
        service: "staking",
        plan_name: "VIP 12-Month Lock (42% APY)",
        amount: data.amount,
        currency: "USDT",
        status: "active",
        started_at: started.toISOString(),
        ends_at: ends.toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("user_offers").upsert({
      user_id: userId,
      offer_slug: "vip-lock",
      status: "used",
      claimed_at: new Date().toISOString(),
      expires_at: ends.toISOString(),
      applied_to_investment_id: inv.id,
      payload: { apy_pct: 42, amount: data.amount },
    }, { onConflict: "user_id,offer_slug" });

    return { ok: true, investment_id: inv.id };
  });

// --- Admin ---

export const adminListReferralBonuses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("referral_bonuses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminDecideReferralBonus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      decision: z.enum(["approved", "rejected"]),
      notes: z.string().max(500).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("referral_bonuses")
      .update({
        status: data.decision,
        admin_notes: data.notes ?? null,
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("offers").select("*").order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as OfferRow[];
  });

export const adminToggleOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("offers").update({ is_active: data.is_active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      patch: z.object({
        title: z.string().min(1).max(120).optional(),
        description: z.string().min(1).max(1000).optional(),
        badge: z.string().max(60).nullable().optional(),
        cta_label: z.string().min(1).max(40).optional(),
        duration_days: z.number().int().min(1).max(3650).nullable().optional(),
        min_amount: z.number().min(0).nullable().optional(),
        effect: z.record(z.string(), z.unknown()).optional(),
      }),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("offers").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
