# Programa Insider — operação no banco

O usuário precisa criar a própria conta no Fita antes de ser selecionado.
Localize o UUID dele em `auth.users` e execute um dos comandos abaixo no SQL
Editor do Supabase.

```sql
insert into public.fita_insider_access (user_id, offer)
values ('UUID_DO_USUARIO', 'pro_monthly')
on conflict (user_id) do update set
  offer = excluded.offer,
  status = 'eligible',
  selected_at = timezone('utc', now()),
  claimed_at = null,
  trial_ends_at = null,
  stripe_customer_id = null,
  stripe_subscription_id = null;
```

```sql
insert into public.fita_insider_access (user_id, offer)
values ('UUID_DO_USUARIO', 'personal')
on conflict (user_id) do update set
  offer = excluded.offer,
  status = 'eligible',
  selected_at = timezone('utc', now()),
  claimed_at = null,
  trial_ends_at = null,
  stripe_customer_id = null,
  stripe_subscription_id = null;
```

Depois da inscrição, o webhook marca o acesso como `active`, registra o trial
e atualiza o entitlement do usuário. Quando a assinatura é cancelada, ambos
ficam como `canceled`.

Configure os secrets `FITA_PRO_MONTHLY_INSIDER` e
`FITA_PERSONAL_INSIDER` com os Price IDs dos preços correspondentes no Stripe.
Os valores não são os links `buy.stripe.com`; são os identificadores `price_*`
dos preços usados por esses links. Não é necessário alterar registros antigos
em `fita_entitlements.stripe_price_id`.
