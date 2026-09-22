export type StripeCheckoutState = "idle" | "redirecting" | "configuration_error" | "request_error";

export function isCheckoutBusy(state: StripeCheckoutState) {
  return state === "redirecting";
}

export function checkoutErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/configured/i.test(message)) return "O checkout Stripe ainda não está configurado.";
  return "Não foi possível iniciar o pagamento. Tente novamente em instantes.";
}
