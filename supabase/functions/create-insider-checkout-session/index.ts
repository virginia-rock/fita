import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { insiderCheckoutConfig } from "../_shared/insider-checkout.ts";

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
    const { data: access, error: accessError } = await admin
      .from("fita_insider_access")
      .select("offer, status")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (accessError) throw accessError;
    if (!access || access.status !== "eligible")
      return json({ error: "Insider offer is not available." }, 403);

    const config = insiderCheckoutConfig(access.offer);
    if (!config) return json({ error: "Insider offer is not available." }, 403);

    const metadata = {
      supabase_user_id: authData.user.id,
      plan: config.plan,
      insider_offer: access.offer,
    };
    const baseUrl = requiredEnv("PUBLIC_APP_URL").replace(/\/$/, "");
    const stripe = new Stripe(requiredEnv("STRIPE_SECRET_KEY"));
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: requiredEnv(config.envName), quantity: 1 }],
      customer_email: authData.user.email ?? undefined,
      client_reference_id: authData.user.id,
      metadata,
      subscription_data: {
        metadata,
        trial_period_days: config.trialPeriodDays,
      },
      success_url: `${baseUrl}/conta?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/conta?stripe=cancelled`,
    });
    if (!session.url) return json({ error: "Stripe did not return a Checkout URL." }, 502);
    return json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create Insider Checkout session.";
    const status = /not configured/i.test(message) ? 503 : 500;
    return json(
      {
        error:
          status === 503 ? "Stripe is not configured yet." : "Unable to start Insider Checkout.",
      },
      status,
    );
  }
});
