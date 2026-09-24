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
  p_stripe_price_id text,
  p_insider_offer text,
  p_trial_ends_at timestamptz
)
returns public.fita_entitlements
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.fita_entitlements;
begin
  if p_insider_offer is not null and (
    p_insider_offer not in ('pro_monthly', 'personal')
    or (p_insider_offer = 'pro_monthly' and p_plan <> 'subscription_monthly')
    or (p_insider_offer = 'personal' and p_plan <> 'professional_personal')
  ) then
    raise exception 'Invalid Insider offer for plan';
  end if;

  insert into public.fita_stripe_events (event_id, event_type)
  values (p_event_id, p_event_type)
  on conflict (event_id) do nothing;

  if not found then
    select * into result from public.fita_entitlements where user_id = p_user_id;
    return result;
  end if;

  insert into public.fita_entitlements (
    user_id, plan, status, expires_at, source, stripe_customer_id,
    stripe_subscription_id, stripe_checkout_session_id, stripe_price_id,
    current_period_end, last_stripe_event_id, insider_offer, trial_ends_at
  ) values (
    p_user_id, p_plan, p_status, p_expires_at, 'stripe', p_stripe_customer_id,
    p_stripe_subscription_id, p_stripe_checkout_session_id, p_stripe_price_id,
    p_current_period_end, p_event_id, p_insider_offer, p_trial_ends_at
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
    last_stripe_event_id = excluded.last_stripe_event_id,
    insider_offer = coalesce(excluded.insider_offer, public.fita_entitlements.insider_offer),
    trial_ends_at = coalesce(excluded.trial_ends_at, public.fita_entitlements.trial_ends_at)
  returning * into result;

  if p_insider_offer is not null then
    update public.fita_insider_access
    set
      status = case when p_status = 'canceled' then 'canceled' else 'active' end,
      claimed_at = coalesce(claimed_at, timezone('utc', now())),
      trial_ends_at = coalesce(p_trial_ends_at, trial_ends_at),
      stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id),
      stripe_subscription_id = coalesce(p_stripe_subscription_id, stripe_subscription_id)
    where user_id = p_user_id and offer = p_insider_offer;

    if not found then
      raise exception 'No eligible Insider access found';
    end if;
  end if;

  return result;
end;
$$;

revoke all on function public.apply_stripe_entitlement_event(
  text, text, uuid, text, text, timestamptz, timestamptz, text, text, text, text, text, timestamptz
) from public;
grant execute on function public.apply_stripe_entitlement_event(
  text, text, uuid, text, text, timestamptz, timestamptz, text, text, text, text, text, timestamptz
) to service_role;
