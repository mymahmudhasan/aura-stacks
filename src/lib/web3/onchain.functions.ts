import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const USDT_BEP20 = "0x55d398326f99059fF775485246999027B3197955".toLowerCase();
const USDT_ERC20 = "0xdAC17F958D2ee523a2206206994597C13D831ec7".toLowerCase();
const ERC20_DECIMALS: Record<string, number> = { [USDT_BEP20]: 18, [USDT_ERC20]: 6 };
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

function rpcUrl(network: "BEP20" | "ERC20") {
  if (network === "BEP20") return process.env.EVM_RPC_BSC || "https://bsc-dataseed.binance.org";
  return process.env.EVM_RPC_ETH || "https://ethereum-rpc.publicnode.com";
}
function tronUrl() {
  return process.env.TRON_RPC || "https://api.trongrid.io";
}

async function evmRpc<T = unknown>(url: string, method: string, params: unknown[]): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const j = (await res.json()) as { result?: T; error?: { message: string } };
  if (j.error) throw new Error(j.error.message);
  return j.result as T;
}

function topicAddress(topic: string): string {
  return ("0x" + topic.slice(26)).toLowerCase();
}

export const createOnChainDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        amount: z.number().positive().max(1_000_000),
        network: z.enum(["TRC20", "BEP20", "ERC20"]),
        tx_hash: z.string().trim().min(10).max(200),
        from_address: z.string().trim().min(3).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Avoid duplicates on the same hash
    const { data: existing } = await supabase
      .from("deposits")
      .select("id")
      .eq("tx_hash", data.tx_hash)
      .maybeSingle();
    if (existing) return { id: existing.id, duplicate: true };

    const { data: row, error } = await supabase
      .from("deposits")
      .insert({
        user_id: userId,
        amount: data.amount,
        network: data.network,
        tx_hash: data.tx_hash,
        from_address: data.from_address,
        method: "wallet_connect",
        status: "pending",
        admin_notes: "Submitted via Wallet Connect — auto-verifying on-chain.",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, duplicate: false };
  });

export const verifyOnChainDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ deposit_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: dep } = await supabaseAdmin
      .from("deposits")
      .select("id,user_id,amount,network,tx_hash,status,method")
      .eq("id", data.deposit_id)
      .maybeSingle();
    if (!dep) throw new Error("Deposit not found");
    if (dep.user_id !== userId) throw new Error("Forbidden");
    if (dep.status === "approved") return { status: "approved" as const };
    if (dep.status === "rejected") return { status: "rejected" as const };
    if (dep.method !== "wallet_connect") return { status: dep.status };

    const { data: settings } = await supabaseAdmin
      .from("site_settings")
      .select("usdt_trc20_address,usdt_bep20_address,usdt_erc20_address")
      .eq("id", 1)
      .maybeSingle();
    if (!settings) throw new Error("Site addresses not configured");

    const network = dep.network as "BEP20" | "ERC20" | "TRC20";
    const expectedAmount = Number(dep.amount);
    const txHash = dep.tx_hash as string;

    let verified = false;
    let reason = "";

    try {
      if (network === "TRC20") {
        const expectTo = settings.usdt_trc20_address;
        if (!expectTo) throw new Error("TRC20 address not configured");
        const res = await fetch(`${tronUrl()}/v1/transactions/${txHash}`);
        const j = await res.json() as { data?: Array<{ ret?: Array<{ contractRet?: string }>; raw_data?: { contract?: Array<{ parameter?: { value?: { amount?: number; to_address?: string } } }> } }> };
        const tx = j.data?.[0];
        if (!tx) {
          reason = "Tron tx not yet indexed";
        } else {
          const ok = tx.ret?.[0]?.contractRet === "SUCCESS";
          // Use trc20 transfer info endpoint for token transfers
          const infoRes = await fetch(`${tronUrl()}/v1/transactions/${txHash}/events`);
          const info = await infoRes.json() as { data?: Array<{ contract_address?: string; result?: Record<string, string> }> };
          const evt = info.data?.find((e) => (e.contract_address || "").toLowerCase() === "41a614f803b6fd780986a42c78ec9c7f77e6ded13c");
          if (ok && evt) {
            const to = evt.result?.to;
            const value = Number(evt.result?.value ?? 0) / 10 ** 6;
            if (to && to.toLowerCase() === expectTo.toLowerCase() && value + 1e-6 >= expectedAmount) {
              verified = true;
            } else {
              reason = `TRC20 mismatch (to=${to}, value=${value})`;
            }
          } else {
            reason = "TRC20 transfer event not found";
          }
        }
      } else {
        const expectTo = (network === "BEP20" ? settings.usdt_bep20_address : settings.usdt_erc20_address) || "";
        if (!expectTo) throw new Error(`${network} address not configured`);
        const token = network === "BEP20" ? USDT_BEP20 : USDT_ERC20;
        const decimals = ERC20_DECIMALS[token];
        const url = rpcUrl(network);
        const receipt = await evmRpc<{ status: string; logs: Array<{ address: string; topics: string[]; data: string }> } | null>(
          url,
          "eth_getTransactionReceipt",
          [txHash],
        );
        if (!receipt) {
          reason = "Tx not yet mined";
        } else if (receipt.status !== "0x1") {
          reason = "Tx failed on-chain";
        } else {
          const match = receipt.logs.find(
            (l) =>
              l.address.toLowerCase() === token &&
              l.topics[0]?.toLowerCase() === TRANSFER_TOPIC &&
              l.topics[2] &&
              topicAddress(l.topics[2]) === expectTo.toLowerCase(),
          );
          if (!match) {
            reason = `No USDT transfer to ${expectTo} found in tx`;
          } else {
            const value = Number(BigInt(match.data)) / 10 ** decimals;
            if (value + 1e-6 >= expectedAmount) {
              verified = true;
            } else {
              reason = `Amount too low (sent ${value}, expected ${expectedAmount})`;
            }
          }
        }
      }
    } catch (e) {
      reason = e instanceof Error ? e.message : String(e);
    }

    if (verified) {
      const { error } = await supabaseAdmin
        .from("deposits")
        .update({ status: "approved", admin_notes: "Auto-approved via on-chain verification." })
        .eq("id", dep.id);
      if (error) throw new Error(error.message);
      return { status: "approved" as const };
    }
    return { status: "confirming" as const, reason };
  });
