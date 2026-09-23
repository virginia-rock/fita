create table if not exists public.fita_professional_links (
  id uuid primary key default gen_random_uuid(),
  professional_user_id uuid not null references auth.users (id) on delete cascade,
  student_user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending',
  can_student_edit boolean not null default false,
  invited_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint fita_professional_links_status_check check (status in ('pending', 'active', 'ended', 'revoked')),
  constraint fita_professional_links_not_self check (professional_user_id <> student_user_id)
);

create unique index if not exists fita_professional_links_one_active_student_idx
  on public.fita_professional_links (student_user_id)
  where status = 'active';

create index if not exists fita_professional_links_professional_active_idx
  on public.fita_professional_links (professional_user_id, status);

create table if not exists public.fita_professional_invitations (
  id uuid primary key default gen_random_uuid(),
  professional_user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  status text not null default 'pending',
  link_id uuid references public.fita_professional_links (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint fita_professional_invitations_status_check check (status in ('pending', 'accepted', 'expired', 'revoked'))
);

create index if not exists fita_professional_invitations_email_idx
  on public.fita_professional_invitations (lower(email), status);

alter table public.fita_professional_links enable row level security;
alter table public.fita_professional_invitations enable row level security;

revoke all on table public.fita_professional_links from anon, authenticated;
revoke all on table public.fita_professional_invitations from anon, authenticated;
grant select on table public.fita_professional_links to authenticated;
grant select on table public.fita_professional_invitations to authenticated;

drop policy if exists "Users can read their professional links" on public.fita_professional_links;
create policy "Users can read their professional links"
  on public.fita_professional_links
  for select
  to authenticated
  using ((select auth.uid()) in (professional_user_id, student_user_id));

drop policy if exists "Professionals can read their invitations" on public.fita_professional_invitations;
create policy "Professionals can read their invitations"
  on public.fita_professional_invitations
  for select
  to authenticated
  using ((select auth.uid()) = professional_user_id);

create or replace function public.professional_limit_for_plan(target_plan text)
returns integer
language sql
immutable
as $$
  select case target_plan
    when 'professional_personal' then 10
    when 'professional_personal_pro' then 30
    when 'professional_studio' then 100
    else null
  end;
$$;

create or replace function public.create_professional_invitation(target_email text)
returns table (invitation_token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  normalized_email text := lower(trim(target_email));
  plan_name text;
  active_count integer;
  limit_count integer;
  raw_token text := encode(gen_random_bytes(24), 'hex');
  expires timestamptz := timezone('utc', now()) + interval '7 days';
begin
  if actor is null then raise exception 'Not authenticated'; end if;
  select plan into plan_name from public.fita_entitlements
    where user_id = actor and status = 'active';
  limit_count := public.professional_limit_for_plan(plan_name);
  if limit_count is null then raise exception 'Professional plan required'; end if;
  select count(*) into active_count from public.fita_professional_links
    where professional_user_id = actor and status = 'active';
  if active_count >= limit_count then raise exception 'Student limit reached'; end if;
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Invalid email';
  end if;
  insert into public.fita_professional_invitations
    (professional_user_id, email, token_hash, expires_at)
  values (actor, normalized_email, encode(digest(raw_token, 'sha256'), 'hex'), expires);
  return query select raw_token, expires;
end;
$$;

create or replace function public.accept_professional_invitation(invitation_token text)
returns public.fita_professional_links
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  actor_email text;
  invitation public.fita_professional_invitations;
  result public.fita_professional_links;
begin
  if actor is null then raise exception 'Not authenticated'; end if;
  select lower(email) into actor_email from auth.users where id = actor;
  select * into invitation from public.fita_professional_invitations
    where token_hash = encode(digest(trim(invitation_token), 'sha256'), 'hex')
      and status = 'pending' and expires_at > timezone('utc', now())
      and lower(email) = actor_email
    for update;
  if invitation.id is null then raise exception 'Invitation expired or invalid'; end if;
  if exists (select 1 from public.fita_professional_links where student_user_id = actor and status = 'active') then
    raise exception 'Student already linked';
  end if;
  insert into public.fita_professional_links
    (professional_user_id, student_user_id, status, accepted_at)
  values (invitation.professional_user_id, actor, 'active', timezone('utc', now()))
  returning * into result;
  update public.fita_professional_invitations
    set status = 'accepted', link_id = result.id where id = invitation.id;
  return result;
end;
$$;

create or replace function public.end_professional_link(target_link_id uuid)
returns public.fita_professional_links
language plpgsql security definer set search_path = public
as $$
declare result public.fita_professional_links;
begin
  update public.fita_professional_links set status = 'ended', ended_at = timezone('utc', now())
  where id = target_link_id and professional_user_id = auth.uid() and status = 'active'
  returning * into result;
  if result.id is null then raise exception 'Link not found or not authorized'; end if;
  return result;
end;
$$;

create or replace function public.leave_professional_link(target_link_id uuid)
returns public.fita_professional_links
language plpgsql security definer set search_path = public
as $$
declare result public.fita_professional_links;
begin
  update public.fita_professional_links set status = 'ended', ended_at = timezone('utc', now())
  where id = target_link_id and student_user_id = auth.uid() and status = 'active'
  returning * into result;
  if result.id is null then raise exception 'Link not found or not authorized'; end if;
  return result;
end;
$$;

create or replace function public.list_professional_students()
returns table (link_id uuid, student_user_id uuid, student_email text, status text)
language sql security definer set search_path = public
as $$
  select l.id, l.student_user_id, u.email, l.status
  from public.fita_professional_links l
  join auth.users u on u.id = l.student_user_id
  where l.professional_user_id = auth.uid() and l.status in ('pending', 'active');
$$;

create or replace function public.get_professional_student_workspace(target_link_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'link_id', l.id,
    'student_user_id', l.student_user_id,
    'student_email', u.email,
    'data', coalesce(d.data, '{"version":1,"entries":[],"recurrence":{}}'::jsonb)
  ) into result
  from public.fita_professional_links l
  join auth.users u on u.id = l.student_user_id
  left join public.fita_data d on d.user_id = l.student_user_id
  where l.id = target_link_id and l.professional_user_id = auth.uid() and l.status = 'active';
  if result is null then raise exception 'Link not found or not authorized'; end if;
  return result;
end;
$$;

create or replace function public.add_professional_evaluation(target_link_id uuid, entry jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare student_id uuid; next_data jsonb;
begin
  select student_user_id into student_id from public.fita_professional_links
    where id = target_link_id and professional_user_id = auth.uid() and status = 'active';
  if student_id is null then raise exception 'Link not found or not authorized'; end if;
  if jsonb_typeof(entry) <> 'object' or entry->>'id' is null or entry->>'date' is null then
    raise exception 'Invalid evaluation';
  end if;
  insert into public.fita_data (user_id, data)
  values (student_id, jsonb_build_object('version', 1, 'entries', jsonb_build_array(entry), 'recurrence', '{}'::jsonb))
  on conflict (user_id) do update set
    data = jsonb_set(public.fita_data.data, '{entries}', coalesce(public.fita_data.data->'entries', '[]'::jsonb) || jsonb_build_array(entry));
  select data into next_data from public.fita_data where user_id = student_id;
  return next_data;
end;
$$;

create or replace function public.get_student_professional_workspace()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'link_id', l.id,
    'professional_user_id', l.professional_user_id,
    'data', coalesce(d.data, '{"version":1,"entries":[],"recurrence":{}}'::jsonb)
  ) into result
  from public.fita_professional_links l
  left join public.fita_data d on d.user_id = l.student_user_id
  where l.student_user_id = auth.uid() and l.status = 'active';
  if result is null then raise exception 'Active professional link not found'; end if;
  return result;
end;
$$;

revoke all on function public.create_professional_invitation(text) from public, anon, authenticated;
revoke all on function public.accept_professional_invitation(text) from public, anon, authenticated;
revoke all on function public.end_professional_link(uuid) from public, anon, authenticated;
revoke all on function public.leave_professional_link(uuid) from public, anon, authenticated;
revoke all on function public.list_professional_students() from public, anon, authenticated;
revoke all on function public.get_professional_student_workspace(uuid) from public, anon, authenticated;
revoke all on function public.add_professional_evaluation(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.get_student_professional_workspace() from public, anon, authenticated;
grant execute on function public.create_professional_invitation(text) to authenticated;
grant execute on function public.accept_professional_invitation(text) to authenticated;
grant execute on function public.end_professional_link(uuid) to authenticated;
grant execute on function public.leave_professional_link(uuid) to authenticated;
grant execute on function public.list_professional_students() to authenticated;
grant execute on function public.get_professional_student_workspace(uuid) to authenticated;
grant execute on function public.add_professional_evaluation(uuid, jsonb) to authenticated;
grant execute on function public.get_student_professional_workspace() to authenticated;
