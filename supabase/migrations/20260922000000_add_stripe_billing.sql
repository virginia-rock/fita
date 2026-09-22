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

create or replace function public.apply_stripe_entitlement_event(
  p_event_id text,
  p_event_type text,
  p_user_id uuid,
  p_plan text,
  p_status text,
  p_expires_at timestamptz,
  p_current_period_end timestamptz,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_checkout_session_id text,
  p_stripe_price_id text
)
returns public.fita_entitlements
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.fita_entitlements;
begin
  insert into public.fita_stripe_events (event_id, event_type)
  values (p_event_id, p_event_type)
  on conflict (event_id) do nothing;

  if not found then
    select * into result
    from public.fita_entitlements
    where user_id = p_user_id;
    return result;
  end if;

  insert into public.fita_entitlements (
    user_id,
    plan,
    status,
    expires_at,
    source,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_checkout_session_id,
    stripe_price_id,
    current_period_end,
    last_stripe_event_id
  )
  values (
    p_user_id,
    p_plan,
    p_status,
    p_expires_at,
    'stripe',
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_checkout_session_id,
    p_stripe_price_id,
    p_current_period_end,
    p_event_id
  )
  on conflict (user_id) do update set
    plan = excluded.plan,
    status = excluded.status,
    expires_at = excluded.expires_at,
    source = 'stripe',
    stripe_customer_id = coalesce(excluded.stripe_customer_id, public.fita_entitlements.stripe_customer_id),
    stripe_subscription_id = coalesce(excluded.stripe_subscription_id, public.fita_entitlements.stripe_subscription_id),
    stripe_checkout_session_id = coalesce(excluded.stripe_checkout_session_id, public.fita_entitlements.stripe_checkout_session_id),
    stripe_price_id = coalesce(excluded.stripe_price_id, public.fita_entitlements.stripe_price_id),
    current_period_end = excluded.current_period_end,
    last_stripe_event_id = excluded.last_stripe_event_id
  returning * into result;

  return result;
end;
$$;

revoke all on function public.apply_stripe_entitlement_event(
  text, text, uuid, text, text, timestamptz, timestamptz, text, text, text, text
) from public;
grant execute on function public.apply_stripe_entitlement_event(
  text, text, uuid, text, text, timestamptz, timestamptz, text, text, text, text
) to service_role;
