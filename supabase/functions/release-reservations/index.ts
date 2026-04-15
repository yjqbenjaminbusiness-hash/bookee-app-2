import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1]
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    return JSON.parse(atob(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate: only service_role can invoke this function
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const claims = parseJwtClaims(token);
  if (claims?.role !== "service_role") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find expired pending reservations
  const now = new Date().toISOString();
  const { data: expired, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, session_id")
    .eq("reservation_status", "pending")
    .not("reserved_until", "is", null)
    .lt("reserved_until", now);

  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!expired || expired.length === 0) {
    return new Response(JSON.stringify({ ok: true, released: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let released = 0;

  for (const booking of expired) {
    const { error: updateErr } = await supabase
      .from("bookings")
      .update({ reservation_status: "cancelled" })
      .eq("id", booking.id);

    if (updateErr) {
      console.error(`Failed to release booking ${booking.id}:`, updateErr);
      continue;
    }

    const { data: sess } = await supabase
      .from("activity_sessions")
      .select("filled_slots")
      .eq("id", booking.session_id)
      .single();

    if (sess && sess.filled_slots > 0) {
      await supabase
        .from("activity_sessions")
        .update({ filled_slots: sess.filled_slots - 1 })
        .eq("id", booking.session_id);
    }

    released++;
  }

  console.log(`Released ${released} expired reservations`);
  return new Response(JSON.stringify({ ok: true, released }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
