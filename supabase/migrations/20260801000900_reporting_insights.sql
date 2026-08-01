create or replace function public.reporting_period_totals(
  chosen_start_date date,
  chosen_end_date date
)
returns table (
  tickets_worked bigint,
  tickets_resolved bigint,
  tickets_closed bigint,
  tasks_completed bigint,
  reminders_completed bigint,
  meetings_attended bigint,
  planned_items bigint,
  completed_items bigint
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
  if chosen_start_date is null
    or chosen_end_date is null
    or chosen_end_date < chosen_start_date
    or chosen_end_date - chosen_start_date > 370 then
    raise exception 'Choose a valid reporting range of 371 days or fewer.';
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
  with work_totals as (
    select
      count(distinct log.work_item_id) filter (where item.kind = 'ticket') as tickets_worked,
      count(distinct log.work_item_id) filter (
        where item.kind = 'task' and log.outcome = 'done'
      ) as tasks_completed,
      count(distinct log.work_item_id) filter (
        where item.kind = 'reminder' and log.outcome = 'done'
      ) as reminders_completed
    from public.work_logs log
    join public.work_items item
      on item.id = log.work_item_id
      and item.workspace_id = log.workspace_id
    where log.workspace_id = personal_workspace_id
      and log.worked_on between chosen_start_date and chosen_end_date
  ),
  status_totals as (
    select
      count(*) filter (
        where event.status_dimension = 'operational'
          and event.to_value = 'resolved'
      ) as tickets_resolved,
      count(*) filter (
        where event.status_dimension = 'tracking'
          and event.to_value = 'closed'
      ) as tickets_closed
    from public.status_events event
    join public.work_items item
      on item.id = event.work_item_id
      and item.workspace_id = event.workspace_id
      and item.kind = 'ticket'
    where event.workspace_id = personal_workspace_id
      and (event.changed_at at time zone report_time_zone)::date
        between chosen_start_date and chosen_end_date
  ),
  plan_totals as (
    select
      count(plan_item.id) as planned_items,
      count(plan_item.id) filter (
        where plan_item.execution_status = 'done'
      ) as completed_items
    from public.daily_plans plan
    left join public.daily_plan_items plan_item
      on plan_item.daily_plan_id = plan.id
      and plan_item.workspace_id = plan.workspace_id
    where plan.workspace_id = personal_workspace_id
      and plan.work_date between chosen_start_date and chosen_end_date
  ),
  meeting_totals as (
    select count(distinct coalesce(event.ical_uid, event.id::text)) as meetings_attended
    from public.external_calendar_events event
    join public.external_calendars calendar
      on calendar.id = event.external_calendar_id
      and calendar.workspace_id = event.workspace_id
      and calendar.is_selected
    join public.meeting_outcomes outcome
      on outcome.external_calendar_event_id = event.id
      and outcome.workspace_id = event.workspace_id
      and outcome.attendance_status = 'attended'
    where event.workspace_id = personal_workspace_id
      and event.event_type = 'default'
      and event.status <> 'cancelled'
      and event.start_local_date between chosen_start_date and chosen_end_date
  )
  select
    coalesce(work.tickets_worked, 0),
    coalesce(status.tickets_resolved, 0),
    coalesce(status.tickets_closed, 0),
    coalesce(work.tasks_completed, 0),
    coalesce(work.reminders_completed, 0),
    coalesce(meeting.meetings_attended, 0),
    coalesce(plan.planned_items, 0),
    coalesce(plan.completed_items, 0)
  from work_totals work
  cross join status_totals status
  cross join plan_totals plan
  cross join meeting_totals meeting;
end;
$$;

create or replace function public.reporting_inventory_metrics(
  chosen_start_date date,
  chosen_end_date date
)
returns table (
  work_date date,
  tickets_received bigint,
  active_tickets bigint,
  waiting_tickets bigint,
  watching_tickets bigint,
  average_active_age numeric,
  age_0_7 bigint,
  age_8_14 bigint,
  age_15_30 bigint,
  age_31_plus bigint
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
  if chosen_start_date is null
    or chosen_end_date is null
    or chosen_end_date < chosen_start_date
    or chosen_end_date - chosen_start_date > 370 then
    raise exception 'Choose a valid reporting range of 371 days or fewer.';
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
  with report_dates as (
    select generate_series(
      chosen_start_date::timestamp,
      chosen_end_date::timestamp,
      interval '1 day'
    )::date as report_date
  ),
  received_metrics as (
    select details.received_at as report_date, count(*) as tickets_received
    from public.ticket_details details
    where details.workspace_id = personal_workspace_id
      and details.received_at between chosen_start_date and chosen_end_date
    group by details.received_at
  ),
  inventory_by_date as (
    select
      date.report_date,
      count(*) filter (
        where tracking.to_value in ('active', 'watching')
      ) as active_tickets,
      count(*) filter (
        where tracking.to_value in ('active', 'watching')
          and operational.to_value = 'waiting_response'
      ) as waiting_tickets,
      count(*) filter (
        where tracking.to_value = 'watching'
      ) as watching_tickets,
      round(avg(date.report_date - details.received_at) filter (
        where tracking.to_value in ('active', 'watching')
      ), 1) as average_active_age,
      count(*) filter (
        where tracking.to_value in ('active', 'watching')
          and date.report_date - details.received_at between 0 and 7
      ) as age_0_7,
      count(*) filter (
        where tracking.to_value in ('active', 'watching')
          and date.report_date - details.received_at between 8 and 14
      ) as age_8_14,
      count(*) filter (
        where tracking.to_value in ('active', 'watching')
          and date.report_date - details.received_at between 15 and 30
      ) as age_15_30,
      count(*) filter (
        where tracking.to_value in ('active', 'watching')
          and date.report_date - details.received_at >= 31
      ) as age_31_plus
    from report_dates date
    left join public.ticket_details details
      on details.workspace_id = personal_workspace_id
      and details.received_at <= date.report_date
    left join public.work_items item
      on item.id = details.work_item_id
      and item.workspace_id = details.workspace_id
      and (item.created_at at time zone report_time_zone)::date <= date.report_date
    left join lateral (
      select event.to_value
      from public.status_events event
      where event.workspace_id = personal_workspace_id
        and event.work_item_id = item.id
        and event.status_dimension = 'tracking'
        and (event.changed_at at time zone report_time_zone)::date <= date.report_date
      order by event.changed_at desc, event.id desc
      limit 1
    ) tracking on true
    left join lateral (
      select event.to_value
      from public.status_events event
      where event.workspace_id = personal_workspace_id
        and event.work_item_id = item.id
        and event.status_dimension = 'operational'
        and (event.changed_at at time zone report_time_zone)::date <= date.report_date
      order by event.changed_at desc, event.id desc
      limit 1
    ) operational on true
    group by date.report_date
  )
  select
    date.report_date,
    coalesce(received.tickets_received, 0),
    coalesce(inventory.active_tickets, 0),
    coalesce(inventory.waiting_tickets, 0),
    coalesce(inventory.watching_tickets, 0),
    coalesce(inventory.average_active_age, 0),
    coalesce(inventory.age_0_7, 0),
    coalesce(inventory.age_8_14, 0),
    coalesce(inventory.age_15_30, 0),
    coalesce(inventory.age_31_plus, 0)
  from report_dates date
  left join received_metrics received on received.report_date = date.report_date
  left join inventory_by_date inventory on inventory.report_date = date.report_date
  order by date.report_date;
end;
$$;

revoke all on function public.reporting_period_totals(date, date) from public;
revoke all on function public.reporting_inventory_metrics(date, date) from public;
grant execute on function public.reporting_period_totals(date, date) to authenticated;
grant execute on function public.reporting_inventory_metrics(date, date) to authenticated;
