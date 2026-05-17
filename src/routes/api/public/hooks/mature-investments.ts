import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/hooks/mature-investments")({
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

        // Flip every active investment whose term has ended to 'completed'.
        const { data, error } = await supabaseAdmin
          .from("investments")
          .update({ status: "completed" })
          .eq("status", "active")
          .not("ends_at", "is", null)
          .lte("ends_at", new Date().toISOString())
          .select("id");

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({ ok: true, matured: data?.length ?? 0 }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
