-- Versioned, portable workspace recovery without authentication or OAuth secrets.

create table public.calendar_outcome_recovery (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  provider_calendar_id text not null,
  provider_event_id text not null,
  attendance_status public.meeting_attendance_status not null,
  local_note text check (local_note is null or char_length(local_note) <= 2000),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, provider_calendar_id, provider_event_id)
);

alter table public.calendar_outcome_recovery enable row level security;
revoke all on public.calendar_outcome_recovery from anon, authenticated;
grant all on public.calendar_outcome_recovery to service_role;

create or replace function public.apply_calendar_outcome_recovery(target_workspace_id uuid)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare applied_count integer;
begin
  insert into public.meeting_outcomes (
    workspace_id, external_calendar_event_id, attendance_status, local_note, confirmed_at
  )
  select recovery.workspace_id, event.id, recovery.attendance_status,
    recovery.local_note, recovery.confirmed_at
  from public.calendar_outcome_recovery recovery
  join public.external_calendars calendar
    on calendar.workspace_id = recovery.workspace_id
    and calendar.provider_calendar_id = recovery.provider_calendar_id
  join public.external_calendar_events event
    on event.workspace_id = recovery.workspace_id
    and event.external_calendar_id = calendar.id
    and event.provider_event_id = recovery.provider_event_id
  where recovery.workspace_id = target_workspace_id
  on conflict (external_calendar_event_id) do update
  set attendance_status = excluded.attendance_status,
      local_note = excluded.local_note,
      confirmed_at = excluded.confirmed_at;
  get diagnostics applied_count = row_count;

  delete from public.calendar_outcome_recovery recovery
  where recovery.workspace_id = target_workspace_id
    and exists (
      select 1 from public.external_calendars calendar
      join public.external_calendar_events event
        on event.workspace_id = calendar.workspace_id
        and event.external_calendar_id = calendar.id
      where calendar.workspace_id = recovery.workspace_id
        and calendar.provider_calendar_id = recovery.provider_calendar_id
        and event.provider_event_id = recovery.provider_event_id
    );
  return applied_count;
end;
$$;

revoke all on function public.apply_calendar_outcome_recovery(uuid) from public;
grant execute on function public.apply_calendar_outcome_recovery(uuid) to service_role;

create or replace function public.create_workspace_backup()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  current_profile_id uuid := (select auth.uid());
begin
  if current_profile_id is null then raise exception 'Authentication is required.'; end if;
  select workspace_id into personal_workspace_id
  from public.workspace_members
  where profile_id = current_profile_id and role = 'owner'
  order by created_at limit 1;
  if personal_workspace_id is null then raise exception 'A personal workspace was not found.'; end if;

  return jsonb_build_object(
    'schema', 'north-haven.workspace-backup',
    'version', 1,
    'exported_at', now(),
    'source_workspace_id', personal_workspace_id,
    'profile', (select jsonb_build_object(
      'display_name', display_name, 'time_zone', time_zone
    ) from public.profiles where id = current_profile_id),
    'workspace', (select jsonb_build_object('name', name)
      from public.workspaces where id = personal_workspace_id),
    'work_schedule', (select to_jsonb(schedule) - 'workspace_id'
      from public.work_schedules schedule where workspace_id = personal_workspace_id),
    'tables', jsonb_build_object(
      'ticket_types', coalesce((select jsonb_agg(to_jsonb(t) - 'workspace_id' order by sort_order, id)
        from public.ticket_types t where workspace_id = personal_workspace_id), '[]'::jsonb),
      'work_items', coalesce((select jsonb_agg(to_jsonb(t) - 'workspace_id' - 'created_by' order by created_at, id)
        from public.work_items t where workspace_id = personal_workspace_id), '[]'::jsonb),
      'ticket_details', coalesce((select jsonb_agg(to_jsonb(t) - 'workspace_id' - 'normalized_ticket_number' order by created_at, work_item_id)
        from public.ticket_details t where workspace_id = personal_workspace_id), '[]'::jsonb),
      'task_details', coalesce((select jsonb_agg(to_jsonb(t) - 'workspace_id' order by created_at, work_item_id)
        from public.task_details t where workspace_id = personal_workspace_id), '[]'::jsonb),
      'reminder_details', coalesce((select jsonb_agg(to_jsonb(t) - 'workspace_id' order by created_at, work_item_id)
        from public.reminder_details t where workspace_id = personal_workspace_id), '[]'::jsonb),
      'follow_ups', coalesce((select jsonb_agg(to_jsonb(t) - 'workspace_id' - 'created_by' order by created_at, id)
        from public.follow_ups t where workspace_id = personal_workspace_id), '[]'::jsonb),
      'work_item_notes', coalesce((select jsonb_agg(to_jsonb(t) - 'workspace_id' - 'created_by' order by created_at, id)
        from public.work_item_notes t where workspace_id = personal_workspace_id), '[]'::jsonb),
      'status_events', coalesce((select jsonb_agg(
        (to_jsonb(t) - 'workspace_id' - 'changed_by') || jsonb_build_object('had_actor', changed_by is not null)
        order by changed_at, id) from public.status_events t
        where workspace_id = personal_workspace_id), '[]'::jsonb),
      'daily_plans', coalesce((select jsonb_agg(to_jsonb(t) - 'workspace_id' order by work_date, id)
        from public.daily_plans t where workspace_id = personal_workspace_id), '[]'::jsonb),
      'daily_plan_items', coalesce((select jsonb_agg(to_jsonb(t) - 'workspace_id' order by created_at, id)
        from public.daily_plan_items t where workspace_id = personal_workspace_id), '[]'::jsonb),
      'work_logs', coalesce((select jsonb_agg(to_jsonb(t) - 'workspace_id' order by worked_on, created_at, id)
        from public.work_logs t where workspace_id = personal_workspace_id), '[]'::jsonb),
      'day_notes', coalesce((select jsonb_agg(to_jsonb(t) - 'workspace_id' order by work_date, id)
        from public.day_notes t where workspace_id = personal_workspace_id), '[]'::jsonb),
      'month_notes', coalesce((select jsonb_agg(to_jsonb(t) - 'workspace_id' order by month_start, id)
        from public.month_notes t where workspace_id = personal_workspace_id), '[]'::jsonb),
      'non_working_days', coalesce((select jsonb_agg(to_jsonb(t) - 'workspace_id' order by work_date, id)
        from public.non_working_days t where workspace_id = personal_workspace_id and source = 'manual'), '[]'::jsonb),
      'calendar_outcomes', coalesce((
        select jsonb_agg(to_jsonb(outcome_data) - 'priority'
          order by provider_calendar_id, provider_event_id)
        from (
          select distinct on (combined.provider_calendar_id, combined.provider_event_id) combined.*
          from (
            select calendar.provider_calendar_id, event.provider_event_id,
              outcome.attendance_status, outcome.local_note, outcome.confirmed_at, 0 as priority
            from public.meeting_outcomes outcome
            join public.external_calendar_events event
              on event.id = outcome.external_calendar_event_id and event.workspace_id = outcome.workspace_id
            join public.external_calendars calendar
              on calendar.id = event.external_calendar_id and calendar.workspace_id = event.workspace_id
            where outcome.workspace_id = personal_workspace_id
            union all
            select provider_calendar_id, provider_event_id, attendance_status,
              local_note, confirmed_at, 1 as priority
            from public.calendar_outcome_recovery where workspace_id = personal_workspace_id
          ) combined
          order by combined.provider_calendar_id, combined.provider_event_id, combined.priority
        ) outcome_data
      ), '[]'::jsonb)
    ),
    'security', jsonb_build_object(
      'contains_authentication_secrets', false,
      'google_credentials_included', false,
      'provider_calendar_cache_included', false
    )
  );
end;
$$;

revoke all on function public.create_workspace_backup() from public;
grant execute on function public.create_workspace_backup() to authenticated;

create or replace function public.restore_workspace_backup(
  chosen_backup jsonb,
  chosen_confirmation text
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  current_profile_id uuid := (select auth.uid());
  section_name text;
  restored_outcomes integer;
begin
  if current_profile_id is null then raise exception 'Authentication is required.'; end if;
  if chosen_confirmation is distinct from 'RESTORE NORTH HAVEN' then
    raise exception 'The restore confirmation did not match.';
  end if;
  if chosen_backup is null
    or chosen_backup ->> 'schema' <> 'north-haven.workspace-backup'
    or chosen_backup ->> 'version' <> '1'
    or jsonb_typeof(chosen_backup -> 'profile') <> 'object'
    or jsonb_typeof(chosen_backup -> 'workspace') <> 'object'
    or jsonb_typeof(chosen_backup -> 'work_schedule') <> 'object'
    or jsonb_typeof(chosen_backup -> 'tables') <> 'object' then
    raise exception 'This is not a supported North Haven workspace backup.';
  end if;
  if octet_length(chosen_backup::text) > 10485760 then
    raise exception 'The workspace backup is larger than 10 MB.';
  end if;
  foreach section_name in array array[
    'ticket_types', 'work_items', 'ticket_details', 'task_details',
    'reminder_details', 'follow_ups', 'work_item_notes', 'status_events',
    'daily_plans', 'daily_plan_items', 'work_logs', 'day_notes',
    'month_notes', 'non_working_days', 'calendar_outcomes'
  ] loop
    if jsonb_typeof(chosen_backup -> 'tables' -> section_name) <> 'array' then
      raise exception 'The workspace backup section % is invalid.', section_name;
    end if;
    if jsonb_array_length(chosen_backup -> 'tables' -> section_name) > 25000 then
      raise exception 'The workspace backup section % is too large.', section_name;
    end if;
  end loop;

  select workspace_id into personal_workspace_id
  from public.workspace_members
  where profile_id = current_profile_id and role = 'owner'
  order by created_at limit 1;
  if personal_workspace_id is null then raise exception 'A personal workspace was not found.'; end if;
  perform 1 from public.workspaces where id = personal_workspace_id for update;

  -- Provider credentials and synced cache stay intact; user-owned meeting
  -- outcomes are replaced and can wait safely for a future calendar sync.
  delete from public.meeting_outcomes where workspace_id = personal_workspace_id;
  delete from public.calendar_outcome_recovery where workspace_id = personal_workspace_id;
  delete from public.work_logs where workspace_id = personal_workspace_id;
  delete from public.daily_plan_items where workspace_id = personal_workspace_id;
  delete from public.daily_plans where workspace_id = personal_workspace_id;
  delete from public.follow_ups where workspace_id = personal_workspace_id;
  delete from public.work_item_notes where workspace_id = personal_workspace_id;
  delete from public.status_events where workspace_id = personal_workspace_id;
  delete from public.work_items where workspace_id = personal_workspace_id;
  delete from public.ticket_types where workspace_id = personal_workspace_id;
  delete from public.day_notes where workspace_id = personal_workspace_id;
  delete from public.month_notes where workspace_id = personal_workspace_id;
  delete from public.non_working_days
    where workspace_id = personal_workspace_id and source = 'manual';

  update public.profiles
  set display_name = trim(chosen_backup -> 'profile' ->> 'display_name'),
      time_zone = trim(chosen_backup -> 'profile' ->> 'time_zone'),
      updated_at = now()
  where id = current_profile_id;
  update public.workspaces
  set name = trim(chosen_backup -> 'workspace' ->> 'name'), updated_at = now()
  where id = personal_workspace_id;
  update public.work_schedules
  set working_weekdays = array(select jsonb_array_elements_text(
        chosen_backup -> 'work_schedule' -> 'working_weekdays')::smallint),
      starts_at_local = (chosen_backup -> 'work_schedule' ->> 'starts_at_local')::time,
      ends_at_local = (chosen_backup -> 'work_schedule' ->> 'ends_at_local')::time,
      time_zone = trim(chosen_backup -> 'work_schedule' ->> 'time_zone')
  where workspace_id = personal_workspace_id;

  insert into public.ticket_types (
    id, workspace_id, name, is_active, sort_order, created_at, updated_at
  )
  select id, personal_workspace_id, name, is_active, sort_order, created_at, updated_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'ticket_types') as restored(
    id uuid, name text, is_active boolean, sort_order integer,
    created_at timestamptz, updated_at timestamptz
  );

  insert into public.work_items (
    id, workspace_id, kind, title, description, tracking_state, due_at,
    archived_at, created_by, created_at, updated_at
  )
  select id, personal_workspace_id, kind, title, description, tracking_state,
    due_at, archived_at, current_profile_id, created_at, updated_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'work_items') as restored(
    id uuid, kind public.work_item_kind, title text, description text,
    tracking_state public.work_tracking_state, due_at timestamptz,
    archived_at timestamptz, created_at timestamptz, updated_at timestamptz
  );

  insert into public.ticket_details (
    work_item_id, workspace_id, kind, ticket_number, ticket_type_id,
    system_priority, operational_status, received_at, resolved_at, closed_at,
    form_backup_completed_at, external_url, created_at, updated_at
  )
  select work_item_id, personal_workspace_id, kind, ticket_number,
    ticket_type_id, system_priority, operational_status, received_at,
    resolved_at, closed_at, form_backup_completed_at, external_url,
    created_at, updated_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'ticket_details') as restored(
    work_item_id uuid, kind public.work_item_kind, ticket_number text,
    ticket_type_id uuid, system_priority public.ticket_priority,
    operational_status public.ticket_operational_status, received_at date,
    resolved_at timestamptz, closed_at timestamptz,
    form_backup_completed_at timestamptz, external_url text,
    created_at timestamptz, updated_at timestamptz
  );

  insert into public.task_details (
    work_item_id, workspace_id, kind, completed_at, created_at, updated_at
  )
  select work_item_id, personal_workspace_id, kind, completed_at, created_at, updated_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'task_details') as restored(
    work_item_id uuid, kind public.work_item_kind, completed_at timestamptz,
    created_at timestamptz, updated_at timestamptz
  );

  insert into public.reminder_details (
    work_item_id, workspace_id, kind, remind_at, acknowledged_at, created_at, updated_at
  )
  select work_item_id, personal_workspace_id, kind, remind_at,
    acknowledged_at, created_at, updated_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'reminder_details') as restored(
    work_item_id uuid, kind public.work_item_kind, remind_at timestamptz,
    acknowledged_at timestamptz, created_at timestamptz, updated_at timestamptz
  );

  insert into public.follow_ups (
    id, workspace_id, work_item_id, state, reason, waiting_on, started_at,
    review_on, completed_at, created_by, created_at, updated_at
  )
  select id, personal_workspace_id, work_item_id, state, reason, waiting_on,
    started_at, review_on, completed_at, current_profile_id, created_at, updated_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'follow_ups') as restored(
    id uuid, work_item_id uuid, state public.follow_up_state, reason text,
    waiting_on text, started_at timestamptz, review_on date,
    completed_at timestamptz, created_at timestamptz, updated_at timestamptz
  );

  insert into public.work_item_notes (
    id, workspace_id, work_item_id, body, is_pinned, created_by, created_at, updated_at
  )
  select id, personal_workspace_id, work_item_id, body, is_pinned,
    current_profile_id, created_at, updated_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'work_item_notes') as restored(
    id uuid, work_item_id uuid, body text, is_pinned boolean,
    created_at timestamptz, updated_at timestamptz
  );

  -- Inserts above fire normal history triggers. Replace those generated rows
  -- with the exact backed-up timeline before planning data is restored.
  delete from public.status_events where workspace_id = personal_workspace_id;
  insert into public.status_events (
    id, workspace_id, work_item_id, status_dimension, from_value, to_value,
    changed_by, changed_at
  )
  select id, personal_workspace_id, work_item_id, status_dimension,
    from_value, to_value, case when had_actor then current_profile_id else null end,
    changed_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'status_events') as restored(
    id uuid, work_item_id uuid, status_dimension public.status_dimension,
    from_value text, to_value text, had_actor boolean, changed_at timestamptz
  );

  insert into public.daily_plans (
    id, workspace_id, work_date, status, intention, ready_at, closed_at,
    end_of_day_step, created_at, updated_at
  )
  select id, personal_workspace_id, work_date, status, intention, ready_at,
    closed_at, end_of_day_step, created_at, updated_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'daily_plans') as restored(
    id uuid, work_date date, status public.daily_plan_status, intention text,
    ready_at timestamptz, closed_at timestamptz, end_of_day_step integer,
    created_at timestamptz, updated_at timestamptz
  );

  insert into public.daily_plan_items (
    id, workspace_id, daily_plan_id, work_item_id, position, execution_status,
    started_at, completed_at, outcome_note, deferred_to_plan_id, created_at, updated_at
  )
  select id, personal_workspace_id, daily_plan_id, work_item_id, position,
    execution_status, started_at, completed_at, outcome_note,
    deferred_to_plan_id, created_at, updated_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'daily_plan_items') as restored(
    id uuid, daily_plan_id uuid, work_item_id uuid, position integer,
    execution_status public.plan_execution_status, started_at timestamptz,
    completed_at timestamptz, outcome_note text, deferred_to_plan_id uuid,
    created_at timestamptz, updated_at timestamptz
  );

  insert into public.work_logs (
    id, workspace_id, work_item_id, daily_plan_item_id, worked_on,
    started_at, ended_at, outcome, is_automatic, created_at
  )
  select id, personal_workspace_id, work_item_id, daily_plan_item_id,
    worked_on, started_at, ended_at, outcome, is_automatic, created_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'work_logs') as restored(
    id uuid, work_item_id uuid, daily_plan_item_id uuid, worked_on date,
    started_at timestamptz, ended_at timestamptz,
    outcome public.work_log_outcome, is_automatic boolean, created_at timestamptz
  );

  insert into public.day_notes (
    id, workspace_id, work_date, body, is_important, created_at, updated_at
  )
  select id, personal_workspace_id, work_date, body, is_important, created_at, updated_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'day_notes') as restored(
    id uuid, work_date date, body text, is_important boolean,
    created_at timestamptz, updated_at timestamptz
  );

  insert into public.month_notes (
    id, workspace_id, month_start, body, created_at, updated_at
  )
  select id, personal_workspace_id, month_start, body, created_at, updated_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'month_notes') as restored(
    id uuid, month_start date, body text, created_at timestamptz, updated_at timestamptz
  );

  insert into public.non_working_days (
    id, workspace_id, work_date, kind, source, source_event_id,
    allows_urgent_work, created_at
  )
  select id, personal_workspace_id, work_date, kind, source, source_event_id,
    allows_urgent_work, created_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'non_working_days') as restored(
    id uuid, work_date date, kind public.non_working_day_kind,
    source public.non_working_day_source, source_event_id text,
    allows_urgent_work boolean, created_at timestamptz
  )
  where source = 'manual';

  insert into public.calendar_outcome_recovery (
    workspace_id, provider_calendar_id, provider_event_id,
    attendance_status, local_note, confirmed_at
  )
  select personal_workspace_id, provider_calendar_id, provider_event_id,
    attendance_status, local_note, confirmed_at
  from jsonb_to_recordset(chosen_backup -> 'tables' -> 'calendar_outcomes') as restored(
    provider_calendar_id text, provider_event_id text,
    attendance_status public.meeting_attendance_status,
    local_note text, confirmed_at timestamptz
  )
  on conflict (workspace_id, provider_calendar_id, provider_event_id) do update
  set attendance_status = excluded.attendance_status,
      local_note = excluded.local_note,
      confirmed_at = excluded.confirmed_at;

  restored_outcomes := public.apply_calendar_outcome_recovery(personal_workspace_id);
  return jsonb_build_object(
    'restored_at', now(),
    'calendar_outcomes_applied', restored_outcomes,
    'calendar_outcomes_waiting', (select count(*)
      from public.calendar_outcome_recovery where workspace_id = personal_workspace_id),
    'work_items', jsonb_array_length(chosen_backup -> 'tables' -> 'work_items'),
    'daily_plans', jsonb_array_length(chosen_backup -> 'tables' -> 'daily_plans')
  );
end;
$$;

revoke all on function public.restore_workspace_backup(jsonb, text) from public;
grant execute on function public.restore_workspace_backup(jsonb, text) to authenticated;

create or replace function public.reopen_closed_day(chosen_work_date date)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  reopened_plan_id uuid;
begin
  personal_workspace_id := public.current_personal_workspace_id();
  update public.daily_plans
  set status = 'active', closed_at = null, end_of_day_step = 2
  where workspace_id = personal_workspace_id
    and work_date = chosen_work_date
    and status = 'closed'
  returning id into reopened_plan_id;
  if reopened_plan_id is null then raise exception 'A closed day was not found.'; end if;
  return reopened_plan_id;
end;
$$;

create or replace function public.restore_archived_work_item(target_work_item_id uuid)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare personal_workspace_id uuid;
begin
  personal_workspace_id := public.current_personal_workspace_id();
  update public.work_items
  set tracking_state = 'active', archived_at = null
  where id = target_work_item_id
    and workspace_id = personal_workspace_id
    and tracking_state = 'archived';
  if not found then raise exception 'An archived work item was not found.'; end if;
end;
$$;

revoke all on function public.reopen_closed_day(date) from public;
revoke all on function public.restore_archived_work_item(uuid) from public;
grant execute on function public.reopen_closed_day(date) to authenticated;
grant execute on function public.restore_archived_work_item(uuid) to authenticated;
