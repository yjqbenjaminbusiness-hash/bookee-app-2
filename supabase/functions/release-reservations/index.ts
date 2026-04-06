import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
    return new Response(JSON.stringify({ error: fetchErr.message }), { status: 500 });
  }

  if (!expired || expired.length === 0) {
    return new Response(JSON.stringify({ ok: true, released: 0 }));
  }

  let released = 0;

  for (const booking of expired) {
    // Cancel the booking
    const { error: updateErr } = await supabase
      .from("bookings")
      .update({ reservation_status: "cancelled" })
      .eq("id", booking.id);

    if (updateErr) {
      console.error(`Failed to release booking ${booking.id}:`, updateErr);
      continue;
    }

    // Decrement filled_slots
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
  return new Response(JSON.stringify({ ok: true, released }));
});
