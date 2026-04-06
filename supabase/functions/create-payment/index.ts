import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { session_id, amount, activity_name, organizer_name } = await req.json();
    if (!session_id || !amount) throw new Error("session_id and amount are required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
    }

    // Calculate platform fees (2% player fee, 1% first month discount handled elsewhere)
    const platformFeePercent = 2;
    const platformFee = Math.round(amount * platformFeePercent / 100);
    const totalAmount = amount + platformFee;

    // Create PaymentIntent with PayNow as preferred method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "sgd",
      customer: customerId,
      payment_method_types: ["paynow", "card"],
      metadata: {
        session_id,
        user_id: user.id,
        activity_name: activity_name || "",
        organizer_name: organizer_name || "",
        platform_fee: platformFee.toString(),
        base_amount: amount.toString(),
      },
    });

    return new Response(JSON.stringify({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      total_amount: totalAmount,
      platform_fee: platformFee,
      base_amount: amount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
