export function webhookFailureStatus(error: unknown): 400 | 500 {
  return error instanceof Error && error.name === "StripeSignatureVerificationError" ? 400 : 500;
}
