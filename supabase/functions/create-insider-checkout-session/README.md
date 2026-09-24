# create-insider-checkout-session

Creates a Stripe Checkout Session only for the authenticated user selected in
`public.fita_insider_access`.

Required secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `PUBLIC_APP_URL`
- `FITA_PRO_MONTHLY_INSIDER`
- `FITA_PERSONAL_INSIDER`

The two `FITA_*_INSIDER` values must be recurring Stripe Price IDs configured
with the permanent 30% Insider discount. The function applies a 90-day trial
and stores the user, base plan, and Insider offer in Stripe metadata.
