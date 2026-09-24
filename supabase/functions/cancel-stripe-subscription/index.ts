import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer "))
      return json({ error: "Authentication required." }, 401);
    const auth = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await auth.auth.getUser();
    if (authError || !authData.user) return json({ error: "Authentication required." }, 401);

    const admin = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );
    const { data: entitlement, error: entitlementError } = await admin
      .from("fita_entitlements")
      .select("status, stripe_customer_id, stripe_subscription_id")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (entitlementError) throw entitlementError;
    if (!entitlement?.stripe_subscription_id || entitlement.status === "canceled") {
      return json({ error: "No active subscription was found." }, 409);
    }

    const stripe = new Stripe(requiredEnv("STRIPE_SECRET_KEY"));
    const subscription = await stripe.subscriptions.retrieve(entitlement.stripe_subscription_id);
    if (
      subscription.id !== entitlement.stripe_subscription_id ||
      (entitlement.stripe_customer_id && subscription.customer !== entitlement.stripe_customer_id)
    ) {
      return json({ error: "Subscription ownership could not be verified." }, 403);
    }
    await stripe.subscriptions.cancel(entitlement.stripe_subscription_id);
    return json({ canceled: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to cancel subscription.";
    const status = /not configured/i.test(message) ? 503 : 500;
    return json(
      {
        error: status === 503 ? "Stripe is not configured yet." : "Unable to cancel subscription.",
      },
      status,
    );
  }
});
