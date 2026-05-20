import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const USDT_BEP20 = "0x55d398326f99059fF775485246999027B3197955".toLowerCase();
const USDT_ERC20 = "0xdAC17F958D2ee523a2206206994597C13D831ec7".toLowerCase();
const ERC20_DECIMALS: Record<string, number> = { [USDT_BEP20]: 18, [USDT_ERC20]: 6 };
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
// USDT TRC20 contract (T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb)
const USDT_TRC20_HEX = "41a614f803b6fd780986a42c78ec9c7f77e6ded13c";

// Confirmation thresholds — overridable via env
const MIN_CONF_EVM = Number(process.env.MIN_CONFIRMATIONS_EVM || 12);
const MIN_CONF_TRON = Number(process.env.MIN_CONFIRMATIONS_TRON || 19);

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

type VerifyOutcome =
  | { status: "approved" }
  | { status: "rejected"; reason: string }
  | { status: "confirming"; reason: string; confirmations?: number; required?: number };

type DepositRow = {
  id: string;
  amount: number | string;
  network: string | null;
  tx_hash: string | null;
  status: string;
};
type SiteAddrs = {
  usdt_trc20_address: string | null;
  usdt_bep20_address: string | null;
  usdt_erc20_address: string | null;
};

/**
 * Core on-chain verification — checks the tx exists, the transfer is to OUR
 * address, the amount matches, AND that it has at least N confirmations.
 * Updates the deposit row to "approved" on success. Never throws on transient
 * indexer/RPC issues — returns { status: "confirming" } so the cron can retry.
 */
async function verifyDepositCore(dep: DepositRow, addrs: SiteAddrs): Promise<VerifyOutcome> {
  const network = dep.network as "BEP20" | "ERC20" | "TRC20";
  const expectedAmount = Number(dep.amount);
  const txHash = (dep.tx_hash || "").trim();
  if (!txHash) return { status: "rejected", reason: "Missing tx hash" };
  if (!["TRC20", "BEP20", "ERC20"].includes(network)) {
    return { status: "confirming", reason: "Network not on-chain verifiable" };
  }

  try {
    if (network === "TRC20") {
      const expectTo = addrs.usdt_trc20_address;
      if (!expectTo) return { status: "confirming", reason: "TRC20 address not configured" };

      const [txRes, evtRes, nowRes] = await Promise.all([
        fetch(`${tronUrl()}/v1/transactions/${txHash}`),
        fetch(`${tronUrl()}/v1/transactions/${txHash}/events`),
        fetch(`${tronUrl()}/wallet/getnowblock`, { method: "POST" }),
      ]);
      const txJson = (await txRes.json()) as {
        data?: Array<{
          ret?: Array<{ contractRet?: string }>;
          blockNumber?: number;
        }>;
      };
      const tx = txJson.data?.[0];
      if (!tx) return { status: "confirming", reason: "TRC20 tx not yet indexed" };
      if (tx.ret?.[0]?.contractRet !== "SUCCESS") {
        return { status: "rejected", reason: "TRC20 tx failed on-chain" };
      }

      const info = (await evtRes.json()) as {
        data?: Array<{ contract_address?: string; result?: Record<string, string> }>;
      };
      const evt = info.data?.find(
        (e) => (e.contract_address || "").toLowerCase() === USDT_TRC20_HEX,
      );
      if (!evt) return { status: "rejected", reason: "No USDT TRC20 transfer in tx" };

      const to = (evt.result?.to || "").toLowerCase();
      const value = Number(evt.result?.value ?? 0) / 1e6;
      if (to !== expectTo.toLowerCase()) {
        return { status: "rejected", reason: `Wrong recipient (got ${to})` };
      }
      if (value + 1e-6 < expectedAmount) {
        return { status: "rejected", reason: `Amount too low (sent ${value}, expected ${expectedAmount})` };
      }

      // Confirmations
      const nowBlock = (await nowRes.json()) as { block_header?: { raw_data?: { number?: number } } };
      const head = nowBlock.block_header?.raw_data?.number ?? 0;
      const txBlock = tx.blockNumber ?? 0;
      const confirmations = txBlock > 0 ? Math.max(0, head - txBlock) : 0;
      if (confirmations < MIN_CONF_TRON) {
        return {
          status: "confirming",
          reason: `Waiting for confirmations (${confirmations}/${MIN_CONF_TRON})`,
          confirmations,
          required: MIN_CONF_TRON,
        };
      }
    } else {
      const expectTo =
        (network === "BEP20" ? addrs.usdt_bep20_address : addrs.usdt_erc20_address) || "";
      if (!expectTo) return { status: "confirming", reason: `${network} address not configured` };
      const token = network === "BEP20" ? USDT_BEP20 : USDT_ERC20;
      const decimals = ERC20_DECIMALS[token];
      const url = rpcUrl(network);

      const receipt = await evmRpc<{
        status: string;
        blockNumber: string;
        logs: Array<{ address: string; topics: string[]; data: string }>;
      } | null>(url, "eth_getTransactionReceipt", [txHash]);
      if (!receipt) return { status: "confirming", reason: "Tx not yet mined" };
      if (receipt.status !== "0x1") return { status: "rejected", reason: "Tx failed on-chain" };

      const match = receipt.logs.find(
        (l) =>
          l.address.toLowerCase() === token &&
          l.topics[0]?.toLowerCase() === TRANSFER_TOPIC &&
          l.topics[2] &&
          topicAddress(l.topics[2]) === expectTo.toLowerCase(),
      );
      if (!match) return { status: "rejected", reason: `No USDT transfer to ${expectTo} in tx` };

      const value = Number(BigInt(match.data)) / 10 ** decimals;
      if (value + 1e-6 < expectedAmount) {
        return { status: "rejected", reason: `Amount too low (sent ${value}, expected ${expectedAmount})` };
      }

      const headHex = await evmRpc<string>(url, "eth_blockNumber", []);
      const head = Number(BigInt(headHex));
      const txBlock = Number(BigInt(receipt.blockNumber));
      const confirmations = Math.max(0, head - txBlock);
      if (confirmations < MIN_CONF_EVM) {
        return {
          status: "confirming",
          reason: `Waiting for confirmations (${confirmations}/${MIN_CONF_EVM})`,
          confirmations,
          required: MIN_CONF_EVM,
        };
      }
    }
  } catch (e) {
    return { status: "confirming", reason: e instanceof Error ? e.message : String(e) };
  }

  // Verified + confirmed → approve. The handle_deposit_status trigger credits the balance.
  const { error } = await supabaseAdmin
    .from("deposits")
    .update({
      status: "approved",
      admin_notes: `Auto-approved via on-chain verification (${network}).`,
    })
    .eq("id", dep.id)
    .eq("status", "pending"); // guard against race
  if (error) return { status: "confirming", reason: error.message };
  return { status: "approved" };
}

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
    if (dep.status === "rejected") return { status: "rejected" as const, reason: "Rejected" };

    const { data: addrs } = await supabaseAdmin
      .from("site_settings")
      .select("usdt_trc20_address,usdt_bep20_address,usdt_erc20_address")
      .eq("id", 1)
      .maybeSingle();
    if (!addrs) throw new Error("Site addresses not configured");

    return verifyDepositCore(dep as DepositRow, addrs as SiteAddrs);
  });

/**
 * Cron-callable: sweep all pending on-chain (TRC20/BEP20/ERC20) deposits
 * and auto-approve any that pass verification. Safe to call frequently.
 */
export async function verifyAllPendingDeposits(): Promise<{
  checked: number;
  approved: number;
  rejected: number;
  pending: number;
}> {
  const { data: addrs } = await supabaseAdmin
    .from("site_settings")
    .select("usdt_trc20_address,usdt_bep20_address,usdt_erc20_address")
    .eq("id", 1)
    .maybeSingle();
  if (!addrs) return { checked: 0, approved: 0, rejected: 0, pending: 0 };

  const { data: pending } = await supabaseAdmin
    .from("deposits")
    .select("id,amount,network,tx_hash,status")
    .eq("status", "pending")
    .in("network", ["TRC20", "BEP20", "ERC20"])
    .order("created_at", { ascending: true })
    .limit(50);

  let approved = 0, rejected = 0, stillPending = 0;
  for (const d of pending ?? []) {
    const out = await verifyDepositCore(d as DepositRow, addrs as SiteAddrs);
    if (out.status === "approved") approved++;
    else if (out.status === "rejected") {
      rejected++;
      await supabaseAdmin
        .from("deposits")
        .update({ status: "rejected", admin_notes: `Auto-rejected: ${out.reason}` })
        .eq("id", d.id)
        .eq("status", "pending");
    } else stillPending++;
  }
  return { checked: pending?.length ?? 0, approved, rejected, pending: stillPending };
}
