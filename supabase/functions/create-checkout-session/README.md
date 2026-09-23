# create-checkout-session

Creates a hosted Stripe Checkout Session for an authenticated user.

Required environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `PUBLIC_APP_URL`
- `STRIPE_PRICE_CLOUD_MONTH`
- `STRIPE_PRICE_SUBSCRIPTION` (legacy compatibility)
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_ANNUAL`
- `STRIPE_PRICE_PERSONAL`
- `STRIPE_PRICE_PERSONAL_PRO`
- `STRIPE_PRICE_STUDIO`

Accepted plan identifiers:

- `cloud_month` (legacy one-time plan)
- `subscription` (legacy recurring plan)
- `subscription_monthly`
- `subscription_annual`
- `professional_personal`
- `professional_personal_pro`
- `professional_studio`

The browser sends only the plan identifier. The function resolves the Stripe
Price ID from environment variables and never accepts a Price ID from the
browser. Recurring plans use Stripe subscription mode and the legacy
`cloud_month` plan uses payment mode.
