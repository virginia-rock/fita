create table if not exists public.fita_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'local',
  status text not null default 'active',
  expires_at timestamptz,
  source text not null default 'demo',
  updated_at timestamptz not null default timezone('utc', now()),
  constraint fita_entitlements_plan_check check (plan in ('local', 'cloud_month', 'subscription')),
  constraint fita_entitlements_status_check check (status in ('active', 'expired', 'canceled', 'pending')),
  constraint fita_entitlements_source_check check (source in ('demo', 'stripe'))
);

alter table public.fita_entitlements enable row level security;

revoke all on table public.fita_entitlements from anon, authenticated;
grant select on table public.fita_entitlements to authenticated;

drop policy if exists "Users can read their own Fita entitlement" on public.fita_entitlements;
create policy "Users can read their own Fita entitlement"
  on public.fita_entitlements
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_fita_entitlement_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists fita_entitlements_updated_at on public.fita_entitlements;
create trigger fita_entitlements_updated_at
  before update on public.fita_entitlements
  for each row execute function public.set_fita_entitlement_updated_at();

create or replace function public.activate_demo_entitlement(target_plan text)
returns public.fita_entitlements
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  next_expires_at timestamptz := case
    when target_plan = 'cloud_month' then timezone('utc', now()) + interval '30 days'
    else null
  end;
  result public.fita_entitlements;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if target_plan not in ('cloud_month', 'subscription') then
    raise exception 'Invalid demo plan';
  end if;

  insert into public.fita_entitlements (user_id, plan, status, expires_at, source)
  values (current_user_id, target_plan, 'active', next_expires_at, 'demo')
  on conflict (user_id) do update set
    plan = excluded.plan,
    status = excluded.status,
    expires_at = excluded.expires_at,
    source = excluded.source
  returning * into result;

  return result;
end;
$$;

revoke all on function public.activate_demo_entitlement(text) from public;
grant execute on function public.activate_demo_entitlement(text) to authenticated;

create or replace function public.cancel_demo_entitlement()
returns public.fita_entitlements
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.fita_entitlements;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.fita_entitlements
  set status = 'canceled'
  where user_id = auth.uid()
    and source = 'demo'
  returning * into result;

  if result.user_id is null then
    raise exception 'No demo entitlement found';
  end if;

  return result;
end;
$$;

revoke all on function public.cancel_demo_entitlement() from public;
grant execute on function public.cancel_demo_entitlement() to authenticated;
