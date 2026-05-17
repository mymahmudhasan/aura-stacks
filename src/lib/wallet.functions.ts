import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getMyWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [customer, txns] = await Promise.all([
      supabase
        .from("customers")
        .select("balance,total_deposited,total_withdrawn,currency:preferred_coin,full_name,binance_uid")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("wallet_transactions")
        .select("id,kind,amount,currency,status,notes,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    return {
      customer: customer.data,
      transactions: txns.data ?? [],
    };
  });

export const getMyInvestments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("investments")
      .select("id,service,plan_name,amount,currency,status,started_at,ends_at,created_at,external_provider")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const getDepositSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data } = await supabase
      .from("site_settings")
      .select("usdt_trc20_address,usdt_bep20_address,usdt_erc20_address,binance_pay_id")
      .eq("id", 1)
      .maybeSingle();
    return data ?? null;
  });

export const createDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      amount: z.number().positive().max(1_000_000),
      network: z.enum(["TRC20", "BEP20", "ERC20", "BINANCE_PAY"]),
      tx_hash: z.string().trim().min(4).max(200),
      from_address: z.string().trim().max(200).optional(),
      screenshot_url: z.string().url().max(500).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("deposits")
      .insert({
        user_id: userId,
        amount: data.amount,
        network: data.network,
        tx_hash: data.tx_hash,
        from_address: data.from_address,
        screenshot_url: data.screenshot_url,
        method: "manual_crypto",
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      amount: z.number().positive().max(1_000_000),
      destination_type: z.enum(["binance_uid", "wallet_address"]),
      destination: z.string().trim().min(3).max(200),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: cust } = await supabase
      .from("customers")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    const balance = Number(cust?.balance ?? 0);
    if (balance < data.amount) throw new Error("Insufficient balance");

    const { data: row, error } = await supabase
      .from("withdrawals")
      .insert({
        user_id: userId,
        amount: data.amount,
        destination_type: data.destination_type,
        destination: data.destination,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createInvestment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      service: z.enum(["ai_trading", "mining", "staking"]),
      plan_name: z.string().trim().min(1).max(100),
      amount: z.number().positive().max(1_000_000),
      duration_days: z.number().int().min(1).max(3650).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: cust } = await supabase
      .from("customers")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    const balance = Number(cust?.balance ?? 0);
    if (balance < data.amount) {
      throw new Error("Insufficient balance. Deposit first, then invest.");
    }
    // Insert as pending, then activate to fire trg_investment_status
    // (debits balance + records wallet_transaction atomically in the trigger).
    const { data: row, error } = await supabase
      .from("investments")
      .insert({
        user_id: userId,
        service: data.service,
        plan_name: data.plan_name,
        amount: data.amount,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const startedAt = new Date();
    const days = data.duration_days ?? 30;
    const endsAt = new Date(startedAt.getTime() + days * 24 * 60 * 60 * 1000);
    const { data: activated, error: actErr } = await supabaseAdmin
      .from("investments")
      .update({
        status: "active",
        started_at: startedAt.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .eq("id", row.id)
      .select()
      .single();
    if (actErr) {
      // Roll back the pending row so we don't leave orphans
      await supabaseAdmin.from("investments").delete().eq("id", row.id);
      throw new Error(actErr.message);
    }
    return activated;
  });

export const listLiveActiveInvestments = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("investments")
      .select("id,service,plan_name,amount,started_at,ends_at,user_id")
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const handles = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: custs } = await supabaseAdmin
        .from("customers")
        .select("user_id,full_name")
        .in("user_id", userIds);
      for (const c of custs ?? []) {
        const name = (c.full_name ?? "").trim();
        const h = name ? name.slice(0, 2) + "***" : "an***";
        handles.set(c.user_id as string, h);
      }
    }
    return rows.map((r) => ({
      id: r.id,
      service: r.service,
      plan_name: r.plan_name,
      amount: Number(r.amount),
      started_at: r.started_at,
      ends_at: r.ends_at,
      masked_handle: handles.get(r.user_id as string) ?? "an***",
    }));
  });

export const getMyWelcomeBonus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("welcome_bonuses")
      .select("amount,granted_at")
      .eq("user_id", userId)
      .maybeSingle();
    return data;
  });

export const getMyDeposits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("deposits")
      .select("id,amount,currency,network,tx_hash,status,created_at,approved_at,admin_notes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const getMyWithdrawals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("withdrawals")
      .select("id,amount,currency,destination,destination_type,status,created_at,paid_at,admin_notes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const updateBinanceUid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      binance_uid: z.string().trim().min(3).max(64).regex(/^[a-zA-Z0-9_-]+$/),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    // Use admin client because RLS on customers has no user UPDATE policy.
    const { error } = await supabaseAdmin
      .from("customers")
      .update({ binance_uid: data.binance_uid })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true, binance_uid: data.binance_uid };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("customers")
      .select("full_name,email,phone,country,binance_uid,binance_wallet_address,preferred_coin,account_type,status")
      .eq("user_id", userId)
      .maybeSingle();
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      full_name: z.string().trim().min(1).max(120).optional(),
      phone: z.string().trim().min(4).max(32).regex(/^[+0-9 ()\-]+$/).optional().or(z.literal("")),
      country: z.string().trim().max(80).optional().or(z.literal("")),
      binance_uid: z.string().trim().min(3).max(64).regex(/^[a-zA-Z0-9_-]+$/).optional().or(z.literal("")),
      binance_wallet_address: z.string().trim().min(6).max(120).regex(/^[a-zA-Z0-9]+$/).optional().or(z.literal("")),
      preferred_coin: z.enum(["USDT", "BTC", "ETH", "BNB"]).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const patch: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      patch[k] = v === "" ? null : (v as string);
    }
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabaseAdmin
      .from("customers")
      .update(patch as never)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
