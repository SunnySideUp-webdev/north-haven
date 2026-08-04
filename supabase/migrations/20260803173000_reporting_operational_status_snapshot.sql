drop function if exists public.reporting_work_status_snapshot(date);

create function public.reporting_work_status_snapshot(
  chosen_as_of_date date
)
returns table (
  total_active bigint,
  active_work bigint,
  watching bigint,
  waiting bigint,
  pending bigint,
  in_progress bigint,
  resolved bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  report_time_zone text;
begin
  if chosen_as_of_date is null then
    raise exception 'Choose a valid snapshot date.';
  end if;

  personal_workspace_id := public.current_personal_workspace_id();
  if personal_workspace_id is null then
    raise exception 'Workspace not found.';
  end if;

  select schedule.time_zone into report_time_zone
  from public.work_schedules schedule
  where schedule.workspace_id = personal_workspace_id;
  report_time_zone := coalesce(report_time_zone, 'America/Guatemala');

  return query
  with historical_status as (
    select
      tracking.to_value as tracking_value,
      coalesce(operational.to_value, 'pending') as operational_value
    from public.ticket_details details
    join public.work_items item
      on item.id = details.work_item_id
      and item.workspace_id = details.workspace_id
      and (item.created_at at time zone report_time_zone)::date <= chosen_as_of_date
    left join lateral (
      select event.to_value
      from public.status_events event
      where event.workspace_id = personal_workspace_id
        and event.work_item_id = item.id
        and event.status_dimension = 'tracking'
        and (event.changed_at at time zone report_time_zone)::date <= chosen_as_of_date
      order by event.changed_at desc, event.id desc
      limit 1
    ) tracking on true
    left join lateral (
      select event.to_value
      from public.status_events event
      where event.workspace_id = personal_workspace_id
        and event.work_item_id = item.id
        and event.status_dimension = 'operational'
        and (event.changed_at at time zone report_time_zone)::date <= chosen_as_of_date
      order by event.changed_at desc, event.id desc
      limit 1
    ) operational on true
    where details.workspace_id = personal_workspace_id
      and details.received_at <= chosen_as_of_date
  )
  select
    count(*) filter (
      where status.tracking_value in ('active', 'watching')
    ),
    count(*) filter (
      where status.tracking_value = 'active'
        and status.operational_value <> 'waiting_response'
    ),
    count(*) filter (
      where status.tracking_value = 'watching'
        and status.operational_value <> 'waiting_response'
    ),
    count(*) filter (
      where status.tracking_value in ('active', 'watching')
        and status.operational_value = 'waiting_response'
    ),
    count(*) filter (
      where status.tracking_value in ('active', 'watching')
        and status.operational_value = 'pending'
    ),
    count(*) filter (
      where status.tracking_value in ('active', 'watching')
        and status.operational_value = 'in_progress'
    ),
    count(*) filter (
      where status.tracking_value in ('active', 'watching')
        and status.operational_value = 'resolved'
    )
  from historical_status status;
end;
$$;

revoke all on function public.reporting_work_status_snapshot(date) from public;
grant execute on function public.reporting_work_status_snapshot(date) to authenticated;
