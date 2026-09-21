create table if not exists public.fita_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{"version":1,"entries":[],"recurrence":{}}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint fita_data_data_is_object check (jsonb_typeof(data) = 'object')
);

alter table public.fita_data enable row level security;

revoke all on table public.fita_data from anon, authenticated;
grant select, insert, update, delete on table public.fita_data to authenticated;

drop policy if exists "Users can read their own Fita data" on public.fita_data;
create policy "Users can read their own Fita data"
  on public.fita_data
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own Fita data" on public.fita_data;
create policy "Users can create their own Fita data"
  on public.fita_data
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own Fita data" on public.fita_data;
create policy "Users can update their own Fita data"
  on public.fita_data
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own Fita data" on public.fita_data;
create policy "Users can delete their own Fita data"
  on public.fita_data
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_fita_data_updated_at()
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

drop trigger if exists fita_data_updated_at on public.fita_data;
create trigger fita_data_updated_at
  before update on public.fita_data
  for each row execute function public.set_fita_data_updated_at();
