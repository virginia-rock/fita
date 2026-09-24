# stripe-webhook

Recebe eventos assinados pelo Stripe e sincroniza os entitlements no Supabase.

Variáveis necessárias:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_CLOUD_MONTH`
- `STRIPE_PRICE_SUBSCRIPTION`
- `FITA_PRO_MONTHLY_INSIDER`
- `FITA_PERSONAL_INSIDER`

O endpoint precisa receber o corpo bruto da requisição para validar
`Stripe-Signature`. O RPC `apply_stripe_entitlement_event` combina a gravação
do evento e o upsert do entitlement de forma idempotente.
