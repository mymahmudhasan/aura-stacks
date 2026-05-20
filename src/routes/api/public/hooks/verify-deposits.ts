import { createFileRoute } from "@tanstack/react-router";
import { verifyAllPendingDeposits } from "@/lib/web3/onchain.functions";

export const Route = createFileRoute("/api/public/hooks/verify-deposits")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Verify caller — must present the project's anon/publishable key
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!apikey || !expected || apikey !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        try {
          const result = await verifyAllPendingDeposits();
          return new Response(JSON.stringify({ ok: true, ...result }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
