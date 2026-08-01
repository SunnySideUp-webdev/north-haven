create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  time_zone text not null default 'America/Guatemala',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, profile_id)
);

create table public.work_schedules (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  working_weekdays smallint[] not null default array[1, 2, 3, 4, 5]::smallint[],
  starts_at_local time not null default '08:00:00',
  ends_at_local time not null default '17:00:00',
  time_zone text not null default 'America/Guatemala',
  constraint work_schedule_time_order check (ends_at_local > starts_at_local),
  constraint work_schedule_has_days check (cardinality(working_weekdays) > 0)
);

create index workspace_members_profile_id_idx
  on public.workspace_members (profile_id);

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and profile_id = (select auth.uid())
  );
$$;

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and profile_id = (select auth.uid())
      and role = 'owner'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  chosen_display_name text;
begin
  chosen_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    split_part(coalesce(new.email, 'North Haven user'), '@', 1)
  );

  insert into public.profiles (id, display_name)
  values (new.id, chosen_display_name);

  insert into public.workspaces (name)
  values ('North Haven')
  returning id into personal_workspace_id;

  insert into public.workspace_members (workspace_id, profile_id, role)
  values (personal_workspace_id, new.id, 'owner');

  insert into public.work_schedules (workspace_id)
  values (personal_workspace_id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.work_schedules enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "workspaces_select_member"
  on public.workspaces for select
  to authenticated
  using (public.is_workspace_member(id));

create policy "workspaces_update_owner"
  on public.workspaces for update
  to authenticated
  using (public.is_workspace_owner(id))
  with check (public.is_workspace_owner(id));

create policy "workspace_members_select_member"
  on public.workspace_members for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "work_schedules_select_member"
  on public.work_schedules for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "work_schedules_update_owner"
  on public.work_schedules for update
  to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.is_workspace_owner(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

grant select, update on public.profiles to authenticated;
grant select, update on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select, update on public.work_schedules to authenticated;
