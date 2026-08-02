create type public.calendar_day_color as enum (
  'lavender',
  'blush',
  'rose',
  'cream',
  'sage'
);

create table public.calendar_day_appearances (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  work_date date not null,
  color public.calendar_day_color not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, work_date)
);

create index calendar_day_appearances_workspace_date_idx
  on public.calendar_day_appearances (workspace_id, work_date desc);

create trigger calendar_day_appearances_set_updated_at
  before update on public.calendar_day_appearances
  for each row execute procedure public.set_updated_at();

alter table public.calendar_day_appearances enable row level security;

create policy "calendar_day_appearances_member_all"
  on public.calendar_day_appearances for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

grant select, insert, update, delete
  on public.calendar_day_appearances to authenticated;

alter function public.create_workspace_backup()
  rename to create_workspace_backup_core;
alter function public.restore_workspace_backup(jsonb, text)
  rename to restore_workspace_backup_core;

revoke all on function public.create_workspace_backup_core() from public;
revoke all on function public.create_workspace_backup_core() from authenticated;
revoke all on function public.restore_workspace_backup_core(jsonb, text) from public;
revoke all on function public.restore_workspace_backup_core(jsonb, text) from authenticated;

create function public.create_workspace_backup()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  backup jsonb;
  personal_workspace_id uuid;
  appearances jsonb;
begin
  backup := public.create_workspace_backup_core();
  personal_workspace_id := (backup ->> 'source_workspace_id')::uuid;
  select coalesce(jsonb_agg(to_jsonb(appearance) - 'workspace_id'
    order by work_date, id), '[]'::jsonb)
  into appearances
  from public.calendar_day_appearances appearance
  where workspace_id = personal_workspace_id;

  return jsonb_set(
    backup,
    '{tables,calendar_day_appearances}',
    appearances,
    true
  );
end;
$$;

create function public.restore_workspace_backup(
  chosen_backup jsonb,
  chosen_confirmation text
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  current_profile_id uuid := (select auth.uid());
  appearance_rows jsonb := coalesce(
    chosen_backup -> 'tables' -> 'calendar_day_appearances',
    '[]'::jsonb
  );
  restore_result jsonb;
begin
  if jsonb_typeof(appearance_rows) <> 'array'
    or jsonb_array_length(appearance_rows) > 25000 then
    raise exception 'The calendar day appearance backup section is invalid.';
  end if;

  restore_result := public.restore_workspace_backup_core(
    chosen_backup,
    chosen_confirmation
  );

  select workspace_id into personal_workspace_id
  from public.workspace_members
  where profile_id = current_profile_id and role = 'owner'
  order by created_at limit 1;
  if personal_workspace_id is null then
    raise exception 'A personal workspace was not found.';
  end if;

  delete from public.calendar_day_appearances
  where workspace_id = personal_workspace_id;

  insert into public.calendar_day_appearances (
    id, workspace_id, work_date, color, created_at, updated_at
  )
  select id, personal_workspace_id, work_date, color, created_at, updated_at
  from jsonb_to_recordset(appearance_rows) as restored(
    id uuid, work_date date, color public.calendar_day_color,
    created_at timestamptz, updated_at timestamptz
  );

  return restore_result || jsonb_build_object(
    'calendar_day_appearances', jsonb_array_length(appearance_rows)
  );
end;
$$;

revoke all on function public.create_workspace_backup() from public;
revoke all on function public.restore_workspace_backup(jsonb, text) from public;
grant execute on function public.create_workspace_backup() to authenticated;
grant execute on function public.restore_workspace_backup(jsonb, text) to authenticated;
