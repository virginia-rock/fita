import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { checkoutMetadata, parseCheckoutRequest } from "../_shared/checkout-contract.ts";
import { priceIdForPlan } from "../_shared/stripe-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function appUrl() {
  return requiredEnv("PUBLIC_APP_URL").replace(/\/$/, "");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer "))
      return json({ error: "Authentication required." }, 401);

    const supabase = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: authorization } },
    });
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data.user) return json({ error: "Authentication required." }, 401);

    const plan = parseCheckoutRequest(await request.json());
    const stripe = new Stripe(requiredEnv("STRIPE_SECRET_KEY"));
    const priceId = priceIdForPlan(plan, Deno.env.toObject());
    const metadata = checkoutMetadata(data.user.id, plan);
    const baseUrl = appUrl();

    const session = await stripe.checkout.sessions.create({
      mode: plan === "subscription" ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: data.user.id,
      customer_email: data.user.email ?? undefined,
      metadata,
      ...(plan === "subscription" ? { subscription_data: { metadata } } : {}),
      success_url: `${baseUrl}/conta?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?plan=${plan}&stripe=cancelled`,
    });

    if (!session.url) return json({ error: "Stripe did not return a Checkout URL." }, 502);
    return json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Checkout session.";
    const status = /Authentication required/.test(message)
      ? 401
      : /not configured/i.test(message)
        ? 503
        : 400;
    return json({ error: status === 503 ? "Stripe is not configured yet." : message }, status);
  }
});
