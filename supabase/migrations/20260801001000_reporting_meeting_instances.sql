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
    select count(distinct (
      event.start_local_date,
      coalesce(event.ical_uid, event.id::text)
    )) as meetings_attended
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

revoke all on function public.reporting_period_totals(date, date) from public;
grant execute on function public.reporting_period_totals(date, date) to authenticated;
