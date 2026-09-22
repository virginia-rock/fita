# create-checkout-session

Cria uma Checkout Session hospedada no Stripe para um usuário autenticado.

Variáveis necessárias:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_CLOUD_MONTH`
- `STRIPE_PRICE_SUBSCRIPTION`
- `PUBLIC_APP_URL`

O cliente envia apenas `cloud_month` ou `subscription`. A função escolhe o
Price ID no ambiente e nunca aceita um Price ID vindo do navegador.
