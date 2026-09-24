import {
  parsePaidPlan,
  priceConfigForId,
  type InsiderOffer,
  type PaidPlan,
} from "./stripe-config.ts";

export type StripeEntitlementMutation = {
  eventId: string;
  eventType: string;
  userId: string;
  plan: PaidPlan;
  status: "active" | "pending" | "canceled";
  expiresAt: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePriceId: string;
  insiderOffer: InsiderOffer | null;
  trialEndsAt: string | null;
  subscribedAt: string | null;
};

type StripeEventLike = {
  id?: unknown;
  type?: unknown;
  data?: { object?: Record<string, unknown> };
};

type StripeEnv = Record<string, string | undefined>;

const successfulCheckoutEvents = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

function stringValue(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function metadataOf(object: Record<string, unknown>) {
  return object.metadata && typeof object.metadata === "object"
    ? (object.metadata as Record<string, unknown>)
    : {};
}

function insiderOfferOf(metadata: Record<string, unknown>): InsiderOffer | null {
  const offer = metadata.insider_offer;
  return offer === "pro_monthly" || offer === "personal" ? offer : null;
}

function isoFromUnix(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function subscriptionStatus(value: unknown): StripeEntitlementMutation["status"] | null {
  if (value === "active" || value === "trialing") return "active";
  if (value === "past_due" || value === "incomplete" || value === "unpaid") return "pending";
  if (value === "canceled") return "canceled";
  return null;
}

export function isNewStripeEvent(eventId: string, processedEventIds: Set<string>) {
  return !processedEventIds.has(eventId);
}

export function mapStripeEventToEntitlement(
  event: StripeEventLike,
  env: StripeEnv,
  now = new Date(),
): StripeEntitlementMutation | null {
  const eventId = stringValue(event.id);
  const eventType = stringValue(event.type);
  const object = event.data?.object;
  if (!eventId || !eventType || !object) return null;

  const metadata = metadataOf(object);
  const userId = stringValue(metadata.supabase_user_id);
  const plan = parsePaidPlan(metadata.plan);
  const priceId = stringValue(object.price_id);
  const priceConfig = priceId ? priceConfigForId(priceId, env) : null;
  const insiderOffer = insiderOfferOf(metadata);
  if (
    !userId ||
    !plan ||
    !priceId ||
    !priceConfig ||
    priceConfig.plan !== plan ||
    priceConfig.insiderOffer !== insiderOffer
  )
    return null;

  const customer = stringValue(object.customer);
  const subscription =
    stringValue(object.subscription) ??
    stringValue(object.id && eventType.startsWith("customer.subscription.") ? object.id : null);
  const checkoutSession = stringValue(
    object.id && eventType.startsWith("checkout.session.") ? object.id : null,
  );
  const currentPeriodEnd = isoFromUnix(object.current_period_end);
  const trialEndsAt = isoFromUnix(object.trial_end);

  if (successfulCheckoutEvents.has(eventType)) {
    if (object.payment_status !== "paid" && object.payment_status !== "no_payment_required")
      return null;
    return {
      eventId,
      eventType,
      userId,
      plan,
      status: "active",
      expiresAt:
        plan === "cloud_month"
          ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      currentPeriodEnd,
      stripeCustomerId: customer,
      stripeSubscriptionId: subscription,
      stripeCheckoutSessionId: checkoutSession,
      stripePriceId: priceId,
      insiderOffer,
      trialEndsAt,
      subscribedAt: now.toISOString(),
    };
  }

  if (eventType === "checkout.session.async_payment_failed") return null;

  if (
    eventType === "customer.subscription.updated" ||
    eventType === "customer.subscription.deleted"
  ) {
    const status =
      eventType === "customer.subscription.deleted"
        ? "canceled"
        : subscriptionStatus(object.status);
    if (!status) return null;
    return {
      eventId,
      eventType,
      userId,
      plan,
      status,
      expiresAt: null,
      currentPeriodEnd,
      stripeCustomerId: customer,
      stripeSubscriptionId: subscription,
      stripeCheckoutSessionId: null,
      stripePriceId: priceId,
      insiderOffer,
      trialEndsAt,
      subscribedAt: null,
    };
  }

  if (eventType === "invoice.paid" || eventType === "invoice.payment_failed") {
    return {
      eventId,
      eventType,
      userId,
      plan,
      status: eventType === "invoice.paid" ? "active" : "pending",
      expiresAt: null,
      currentPeriodEnd,
      stripeCustomerId: customer,
      stripeSubscriptionId: subscription,
      stripeCheckoutSessionId: null,
      stripePriceId: priceId,
      insiderOffer,
      trialEndsAt,
      subscribedAt: null,
    };
  }

  return null;
}
