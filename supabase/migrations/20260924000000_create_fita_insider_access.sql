alter table public.fita_entitlements
  add column if not exists insider_offer text,
  add column if not exists trial_ends_at timestamptz,
  add constraint fita_entitlements_insider_offer_check
    check (insider_offer is null or insider_offer in ('pro_monthly', 'personal'));

create table if not exists public.fita_insider_access (
  user_id uuid primary key references auth.users (id) on delete cascade,
  offer text not null check (offer in ('pro_monthly', 'personal')),
  status text not null default 'eligible' check (status in ('eligible', 'active', 'canceled')),
  selected_at timestamptz not null default timezone('utc', now()),
  claimed_at timestamptz,
  trial_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.fita_insider_access enable row level security;

revoke all on table public.fita_insider_access from public, anon, authenticated;
grant select on table public.fita_insider_access to authenticated;

drop policy if exists "Users can read their own Fita Insider access" on public.fita_insider_access;
create policy "Users can read their own Fita Insider access"
  on public.fita_insider_access
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_fita_insider_access_updated_at()
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

drop trigger if exists fita_insider_access_updated_at on public.fita_insider_access;
create trigger fita_insider_access_updated_at
  before update on public.fita_insider_access
  for each row execute function public.set_fita_insider_access_updated_at();
