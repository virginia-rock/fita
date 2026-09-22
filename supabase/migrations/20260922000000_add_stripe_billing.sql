alter table public.fita_entitlements
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_price_id text,
  add column if not exists current_period_end timestamptz,
  add column if not exists last_stripe_event_id text;

create index if not exists fita_entitlements_stripe_subscription_id_idx
  on public.fita_entitlements (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists fita_entitlements_stripe_customer_id_idx
  on public.fita_entitlements (stripe_customer_id)
  where stripe_customer_id is not null;

create table if not exists public.fita_stripe_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default timezone('utc', now())
);

revoke all on table public.fita_stripe_events from public, anon, authenticated;
