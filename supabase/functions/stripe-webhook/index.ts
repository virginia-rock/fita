import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { mapStripeEventToEntitlement } from "../_shared/stripe-event-mapper.ts";

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function enrichEvent(stripe: Stripe, event: Stripe.Event) {
  const object = event.data.object as unknown as Record<string, unknown>;
  let enriched = { ...object };

  if (event.type.startsWith("checkout.session.")) {
    const sessionId = typeof object.id === "string" ? object.id : null;
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items.data.price"],
      });
      const sessionRecord = session as unknown as Record<string, unknown>;
      const lineItems = sessionRecord.line_items as
        { data?: Array<Record<string, unknown>> } | undefined;
      const firstPrice = lineItems?.data?.[0]?.price as Record<string, unknown> | undefined;
      enriched = {
        ...enriched,
        price_id: firstPrice?.id,
      };
    }
  }

  if (event.type.startsWith("customer.subscription.") || event.type.startsWith("invoice.")) {
    const subscriptionId =
      typeof enriched.subscription === "string"
        ? enriched.subscription
        : event.type.startsWith("customer.subscription.") && typeof enriched.id === "string"
          ? enriched.id
          : null;
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const subscriptionRecord = subscription as unknown as Record<string, unknown>;
      const items = subscriptionRecord.items as
        { data?: Array<Record<string, unknown>> } | undefined;
      const firstPrice = items?.data?.[0]?.price as Record<string, unknown> | undefined;
      enriched = {
        ...enriched,
        metadata: subscriptionRecord.metadata,
        customer: subscriptionRecord.customer,
        subscription: subscription.id,
        price_id: firstPrice?.id,
        current_period_end: subscriptionRecord.current_period_end,
      };
    }
  }

  return { ...event, data: { ...event.data, object: enriched } } as Stripe.Event;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const signature = request.headers.get("Stripe-Signature");
    if (!signature) return json({ error: "Missing Stripe signature." }, 400);

    const stripe = new Stripe(requiredEnv("STRIPE_SECRET_KEY"));
    const rawBody = await request.text();
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      requiredEnv("STRIPE_WEBHOOK_SECRET"),
    );
    const enrichedEvent = await enrichEvent(stripe, event);
    const mutation = mapStripeEventToEntitlement(enrichedEvent, Deno.env.toObject());

    if (!mutation) return json({ received: true });

    const admin = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );
    const { error } = await admin.rpc("apply_stripe_entitlement_event", {
      p_event_id: mutation.eventId,
      p_event_type: mutation.eventType,
      p_user_id: mutation.userId,
      p_plan: mutation.plan,
      p_status: mutation.status,
      p_expires_at: mutation.expiresAt,
      p_current_period_end: mutation.currentPeriodEnd,
      p_stripe_customer_id: mutation.stripeCustomerId,
      p_stripe_subscription_id: mutation.stripeSubscriptionId,
      p_stripe_checkout_session_id: mutation.stripeCheckoutSessionId,
      p_stripe_price_id: mutation.stripePriceId,
    });
    if (error) throw error;

    return json({ received: true });
  } catch (error) {
    console.error(
      "Stripe webhook processing failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return json({ error: "Webhook could not be processed." }, 400);
  }
});
