create type public.calendar_connection_status as enum ('connected', 'stale', 'disconnected', 'error');
create type public.external_calendar_event_type as enum ('default', 'out_of_office', 'focus_time', 'other');
create type public.meeting_attendance_status as enum (
  'unconfirmed',
  'probably_attended',
  'attended',
  'cancelled',
  'did_not_attend',
  'not_applicable'
);

create table public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  provider text not null default 'google' check (provider = 'google'),
  provider_account_id text not null,
  account_label text not null check (char_length(account_label) between 1 and 320),
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  access_token_expires_at timestamptz not null,
  scopes text[] not null default '{}',
  status public.calendar_connection_status not null default 'connected',
  last_synced_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider),
  unique (id, workspace_id)
);

create table public.external_calendars (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  calendar_connection_id uuid not null,
  provider_calendar_id text not null,
  name text not null check (char_length(name) between 1 and 500),
  time_zone text,
  is_primary boolean not null default false,
  is_selected boolean not null default false,
  sync_token text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (calendar_connection_id, workspace_id)
    references public.calendar_connections (id, workspace_id) on delete cascade,
  unique (calendar_connection_id, provider_calendar_id),
  unique (id, workspace_id)
);

create table public.external_calendar_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  external_calendar_id uuid not null,
  provider_event_id text not null,
  ical_uid text,
  title text not null default 'Untitled event' check (char_length(title) between 1 and 1000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  start_local_date date not null,
  end_local_date date not null,
  is_all_day boolean not null default false,
  event_type public.external_calendar_event_type not null default 'default',
  status text not null default 'confirmed',
  meeting_url text,
  provider_url text,
  provider_updated_at timestamptz,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (external_calendar_id, workspace_id)
    references public.external_calendars (id, workspace_id) on delete cascade,
  unique (external_calendar_id, provider_event_id),
  unique (id, workspace_id),
  constraint external_calendar_event_time_order check (ends_at > starts_at),
  constraint external_calendar_event_date_order check (end_local_date >= start_local_date)
);

create table public.meeting_outcomes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  external_calendar_event_id uuid not null,
  attendance_status public.meeting_attendance_status not null default 'unconfirmed',
  local_note text check (local_note is null or char_length(local_note) <= 2000),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (external_calendar_event_id, workspace_id)
    references public.external_calendar_events (id, workspace_id) on delete cascade,
  unique (external_calendar_event_id),
  unique (id, workspace_id)
);

create index external_calendars_connection_selected_idx
  on public.external_calendars (calendar_connection_id, is_selected);
create index external_calendar_events_date_idx
  on public.external_calendar_events (workspace_id, start_local_date, end_local_date);
create index external_calendar_events_calendar_updated_idx
  on public.external_calendar_events (external_calendar_id, provider_updated_at);
create index meeting_outcomes_workspace_status_idx
  on public.meeting_outcomes (workspace_id, attendance_status);

create trigger calendar_connections_set_updated_at before update on public.calendar_connections
  for each row execute procedure public.set_updated_at();
create trigger external_calendars_set_updated_at before update on public.external_calendars
  for each row execute procedure public.set_updated_at();
create trigger external_calendar_events_set_updated_at before update on public.external_calendar_events
  for each row execute procedure public.set_updated_at();
create trigger meeting_outcomes_set_updated_at before update on public.meeting_outcomes
  for each row execute procedure public.set_updated_at();

alter table public.calendar_connections enable row level security;
alter table public.external_calendars enable row level security;
alter table public.external_calendar_events enable row level security;
alter table public.meeting_outcomes enable row level security;

-- Calendar credentials and sync metadata are intentionally inaccessible through
-- the browser database client. Authenticated access goes through server-only DTOs.
revoke all on public.calendar_connections from anon, authenticated;
revoke all on public.external_calendars from anon, authenticated;
revoke all on public.external_calendar_events from anon, authenticated;
revoke all on public.meeting_outcomes from anon, authenticated;
grant all on public.calendar_connections to service_role;
grant all on public.external_calendars to service_role;
grant all on public.external_calendar_events to service_role;
grant all on public.meeting_outcomes to service_role;
grant select on public.work_schedules to service_role;
grant select, insert, update, delete on public.non_working_days to service_role;

alter table public.non_working_days
  drop constraint non_working_days_workspace_id_work_date_kind_source_key;
create unique index non_working_days_manual_unique_idx
  on public.non_working_days (workspace_id, work_date, kind, source)
  where source = 'manual';
create unique index non_working_days_google_unique_idx
  on public.non_working_days (workspace_id, work_date, kind, source, source_event_id)
  where source = 'google';

create or replace function public.update_daily_plan_details(
  chosen_work_date date,
  chosen_intention text,
  chosen_mark_ready boolean
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  target_plan_id uuid;
  item_count integer;
  meeting_count integer;
begin
  personal_workspace_id := public.current_personal_workspace_id();
  if personal_workspace_id is null then raise exception 'Workspace not found.'; end if;

  insert into public.daily_plans (workspace_id, work_date, intention)
  values (personal_workspace_id, chosen_work_date, nullif(trim(chosen_intention), ''))
  on conflict (workspace_id, work_date) do update set intention = nullif(trim(chosen_intention), '')
  returning id into target_plan_id;

  if chosen_mark_ready then
    select count(*) into item_count
    from public.daily_plan_items where daily_plan_id = target_plan_id;

    select count(*) into meeting_count
    from public.external_calendar_events event
    join public.external_calendars calendar on calendar.id = event.external_calendar_id
    where event.workspace_id = personal_workspace_id
      and calendar.is_selected
      and event.event_type = 'default'
      and event.status <> 'cancelled'
      and event.start_local_date <= chosen_work_date
      and event.end_local_date >= chosen_work_date;

    if item_count = 0 and meeting_count = 0 then
      raise exception 'Choose at least one work item or connect a meeting before marking this plan ready.';
    end if;
    update public.daily_plans set status = 'ready', ready_at = now() where id = target_plan_id;
  end if;
  return target_plan_id;
end;
$$;

revoke all on function public.update_daily_plan_details(date, text, boolean) from public;
grant execute on function public.update_daily_plan_details(date, text, boolean) to authenticated;
