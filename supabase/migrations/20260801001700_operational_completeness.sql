create or replace function public.previous_workday(chosen_before_date date)
returns date
language plpgsql stable security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  candidate date := chosen_before_date - 1;
  working_days smallint[];
begin
  personal_workspace_id := public.current_personal_workspace_id();
  select working_weekdays into working_days
  from public.work_schedules
  where workspace_id = personal_workspace_id;
  working_days := coalesce(working_days, array[1, 2, 3, 4, 5]::smallint[]);

  for attempt in 1..370 loop
    if extract(isodow from candidate)::smallint = any(working_days)
      and not exists (
        select 1 from public.non_working_days
        where workspace_id = personal_workspace_id and work_date = candidate
      ) then
      return candidate;
    end if;
    candidate := candidate - 1;
  end loop;

  raise exception 'A previous workday could not be calculated.';
end;
$$;

create or replace view public.work_inventory_rows
with (security_invoker = true)
as
select
  work_items.id,
  work_items.workspace_id,
  work_items.kind,
  work_items.title,
  work_items.description,
  work_items.tracking_state,
  work_items.due_at,
  work_items.archived_at,
  work_items.created_at,
  work_items.updated_at,
  ticket_details.ticket_number,
  ticket_details.ticket_type_id,
  ticket_types.name as ticket_type_name,
  ticket_details.system_priority,
  ticket_details.operational_status,
  ticket_details.received_at,
  ticket_details.resolved_at,
  ticket_details.closed_at,
  ticket_details.form_backup_completed_at,
  ticket_details.external_url,
  reminder_details.remind_at,
  task_details.completed_at as task_completed_at,
  reminder_details.acknowledged_at as reminder_acknowledged_at,
  (
    select min(follow_ups.review_on)
    from public.follow_ups
    where follow_ups.work_item_id = work_items.id
      and follow_ups.state = 'open'
  ) as next_review_on,
  (
    select max(work_logs.worked_on)
    from public.work_logs
    where work_logs.work_item_id = work_items.id
  ) as last_worked_on
from public.work_items
left join public.ticket_details on ticket_details.work_item_id = work_items.id
left join public.ticket_types on ticket_types.id = ticket_details.ticket_type_id
left join public.task_details on task_details.work_item_id = work_items.id
left join public.reminder_details on reminder_details.work_item_id = work_items.id;

create or replace function public.bulk_add_work_items_to_plan(
  target_work_item_ids uuid[],
  chosen_work_date date
)
returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  target_plan_id uuid;
  next_position integer;
  inserted_count integer;
  selected_count integer;
begin
  if chosen_work_date is null then
    raise exception 'Choose a work date.';
  end if;

  select count(*) into selected_count
  from (select distinct unnest(target_work_item_ids)) selected;

  if selected_count = 0 or selected_count > 100 then
    raise exception 'Choose between 1 and 100 work items.';
  end if;

  personal_workspace_id := public.current_personal_workspace_id();

  if (
    select count(*)
    from public.work_items
    where workspace_id = personal_workspace_id
      and id = any(target_work_item_ids)
      and tracking_state <> 'archived'
  ) <> selected_count then
    raise exception 'One or more work items are unavailable.';
  end if;

  insert into public.daily_plans (workspace_id, work_date)
  values (personal_workspace_id, chosen_work_date)
  on conflict (workspace_id, work_date) do update
    set status = case
          when public.daily_plans.status in ('ready', 'active') then 'draft'
          else public.daily_plans.status
        end,
        ready_at = case
          when public.daily_plans.status in ('ready', 'active') then null
          else public.daily_plans.ready_at
        end
  returning id into target_plan_id;

  select coalesce(max(position), -1) + 1 into next_position
  from public.daily_plan_items
  where daily_plan_id = target_plan_id;

  with selected as (
    select distinct id
    from unnest(target_work_item_ids) as ids(id)
  ), numbered as (
    select id, row_number() over (order by id) - 1 as offset_position
    from selected
  )
  insert into public.daily_plan_items (
    workspace_id,
    daily_plan_id,
    work_item_id,
    position
  )
  select
    personal_workspace_id,
    target_plan_id,
    numbered.id,
    next_position + numbered.offset_position
  from numbered
  on conflict (daily_plan_id, work_item_id) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.bulk_set_follow_up_review(
  target_work_item_ids uuid[],
  chosen_review_on date
)
returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  updated_count integer;
begin
  if chosen_review_on is null then
    raise exception 'Choose a review date.';
  end if;

  if coalesce(cardinality(target_work_item_ids), 0) = 0
    or cardinality(target_work_item_ids) > 100 then
    raise exception 'Choose between 1 and 100 work items.';
  end if;

  personal_workspace_id := public.current_personal_workspace_id();

  update public.follow_ups
  set review_on = chosen_review_on
  where workspace_id = personal_workspace_id
    and work_item_id = any(target_work_item_ids)
    and state = 'open';

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function public.bulk_archive_work_items(target_work_item_ids uuid[])
returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  archived_count integer;
begin
  if coalesce(cardinality(target_work_item_ids), 0) = 0
    or cardinality(target_work_item_ids) > 100 then
    raise exception 'Choose between 1 and 100 work items.';
  end if;

  personal_workspace_id := public.current_personal_workspace_id();

  if exists (
    select 1
    from public.daily_plan_items
    join public.daily_plans on daily_plans.id = daily_plan_items.daily_plan_id
    where daily_plan_items.workspace_id = personal_workspace_id
      and daily_plan_items.work_item_id = any(target_work_item_ids)
      and daily_plan_items.execution_status in ('planned', 'in_progress')
      and daily_plans.status in ('draft', 'ready', 'active')
  ) then
    raise exception 'Remove selected items from open daily plans before archiving them.';
  end if;

  update public.work_items
  set tracking_state = 'archived', archived_at = now()
  where workspace_id = personal_workspace_id
    and id = any(target_work_item_ids)
    and tracking_state <> 'archived';

  get diagnostics archived_count = row_count;
  return archived_count;
end;
$$;

create or replace function public.find_ticket_by_number(chosen_ticket_number text)
returns uuid
language sql stable security invoker set search_path = ''
as $$
  select work_items.id
  from public.ticket_details
  join public.work_items on work_items.id = ticket_details.work_item_id
  where ticket_details.workspace_id = public.current_personal_workspace_id()
    and ticket_details.normalized_ticket_number = upper(trim(chosen_ticket_number))
  limit 1;
$$;

create or replace function public.global_work_search(
  chosen_query text,
  chosen_include_archived boolean default false
)
returns table (
  id uuid,
  kind public.work_item_kind,
  title text,
  ticket_number text,
  ticket_type_name text,
  operational_status public.ticket_operational_status,
  tracking_state public.work_tracking_state,
  updated_at timestamptz,
  match_reason text
)
language sql stable security invoker set search_path = ''
as $$
  with candidates as (
    select
      work_items.id,
      work_items.kind,
      work_items.title,
      ticket_details.ticket_number,
      ticket_types.name as ticket_type_name,
      ticket_details.operational_status,
      work_items.tracking_state,
      work_items.updated_at,
      case
        when ticket_details.normalized_ticket_number = upper(trim(chosen_query)) then 'Ticket number'
        when lower(work_items.title) like '%' || lower(trim(chosen_query)) || '%' then 'Title'
        when lower(coalesce(ticket_types.name, '')) like '%' || lower(trim(chosen_query)) || '%' then 'Type'
        when exists (
          select 1 from public.work_item_notes
          where work_item_notes.work_item_id = work_items.id
            and lower(work_item_notes.body) like '%' || lower(trim(chosen_query)) || '%'
        ) then 'Notes'
        else 'External link'
      end as match_reason,
      case
        when ticket_details.normalized_ticket_number = upper(trim(chosen_query)) then 0
        when work_items.tracking_state in ('active', 'watching') then 1
        else 2
      end as match_rank
    from public.work_items
    left join public.ticket_details on ticket_details.work_item_id = work_items.id
    left join public.ticket_types on ticket_types.id = ticket_details.ticket_type_id
    where work_items.workspace_id = public.current_personal_workspace_id()
      and (chosen_include_archived or work_items.tracking_state <> 'archived')
      and length(trim(chosen_query)) between 2 and 120
      and (
        ticket_details.normalized_ticket_number = upper(trim(chosen_query))
        or lower(work_items.title) like '%' || lower(trim(chosen_query)) || '%'
        or lower(coalesce(ticket_types.name, '')) like '%' || lower(trim(chosen_query)) || '%'
        or lower(coalesce(ticket_details.external_url, '')) like '%' || lower(trim(chosen_query)) || '%'
        or exists (
          select 1 from public.work_item_notes
          where work_item_notes.work_item_id = work_items.id
            and lower(work_item_notes.body) like '%' || lower(trim(chosen_query)) || '%'
        )
      )
  )
  select
    candidates.id,
    candidates.kind,
    candidates.title,
    candidates.ticket_number,
    candidates.ticket_type_name,
    candidates.operational_status,
    candidates.tracking_state,
    candidates.updated_at,
    candidates.match_reason
  from candidates
  order by candidates.match_rank, candidates.updated_at desc
  limit 30;
$$;

revoke all on function public.previous_workday(date) from public;
revoke all on function public.bulk_add_work_items_to_plan(uuid[], date) from public;
revoke all on function public.bulk_set_follow_up_review(uuid[], date) from public;
revoke all on function public.bulk_archive_work_items(uuid[]) from public;
revoke all on function public.find_ticket_by_number(text) from public;
revoke all on function public.global_work_search(text, boolean) from public;

grant execute on function public.previous_workday(date) to authenticated;
grant execute on function public.bulk_add_work_items_to_plan(uuid[], date) to authenticated;
grant execute on function public.bulk_set_follow_up_review(uuid[], date) to authenticated;
grant execute on function public.bulk_archive_work_items(uuid[]) to authenticated;
grant execute on function public.find_ticket_by_number(text) to authenticated;
grant execute on function public.global_work_search(text, boolean) to authenticated;
