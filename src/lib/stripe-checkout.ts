import { supabase } from "./supabase";

export type StripePaidPlan =
  | "cloud_month"
  | "subscription"
  | "subscription_monthly"
  | "subscription_annual"
  | "professional_personal"
  | "professional_personal_pro"
  | "professional_studio";

export async function createStripeCheckoutSession(plan: StripePaidPlan): Promise<{ url: string }> {
  if (!supabase) throw new Error("O Supabase não está configurado para iniciar o pagamento.");

  const { data, error } = await supabase.functions.invoke<{ url?: unknown; error?: unknown }>(
    "create-checkout-session",
    { body: { plan } },
  );
  if (error) throw new Error("Não foi possível iniciar o Checkout Stripe.");

  if (
    !data ||
    typeof data.url !== "string" ||
    !data.url.startsWith("https://checkout.stripe.com/")
  ) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "O Stripe não retornou uma URL válida.",
    );
  }

  return { url: data.url };
}
