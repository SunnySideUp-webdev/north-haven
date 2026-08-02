drop function if exists public.reporting_daily_metrics(date, date);

create or replace function public.reporting_daily_metrics(
  chosen_start_date date,
  chosen_end_date date
)
returns table (
  work_date date,
  tickets_worked bigint,
  tickets_resolved bigint,
  tickets_closed bigint,
  tasks_completed bigint,
  reminders_completed bigint,
  meetings_attended bigint,
  scheduled_meetings bigint,
  planned_items bigint,
  planned_tickets bigint,
  planned_tasks bigint,
  planned_reminders bigint,
  completed_items bigint,
  returned_items bigint,
  deferred_items bigint,
  skipped_items bigint,
  has_important_note boolean,
  day_note text,
  is_out_of_office boolean,
  plan_intention text,
  plan_status text
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
  work_metrics as (
    select
      log.worked_on as report_date,
      count(distinct log.work_item_id) filter (
        where item.kind = 'ticket'
      ) as tickets_worked,
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
    group by log.worked_on
  ),
  status_metrics as (
    select
      (event.changed_at at time zone report_time_zone)::date as report_date,
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
    group by (event.changed_at at time zone report_time_zone)::date
  ),
  plan_metrics as (
    select
      plan.work_date as report_date,
      plan.intention,
      plan.status::text as status,
      count(plan_item.id) as planned_items,
      count(plan_item.id) filter (
        where item.kind = 'ticket'
      ) as planned_tickets,
      count(plan_item.id) filter (
        where item.kind = 'task'
      ) as planned_tasks,
      count(plan_item.id) filter (
        where item.kind = 'reminder'
      ) as planned_reminders,
      count(plan_item.id) filter (
        where plan_item.execution_status = 'done'
      ) as completed_items,
      count(plan_item.id) filter (
        where plan_item.execution_status = 'returned'
      ) as returned_items,
      count(plan_item.id) filter (
        where plan_item.execution_status = 'deferred'
      ) as deferred_items,
      count(plan_item.id) filter (
        where plan_item.execution_status = 'skipped'
      ) as skipped_items
    from public.daily_plans plan
    left join public.daily_plan_items plan_item
      on plan_item.daily_plan_id = plan.id
      and plan_item.workspace_id = plan.workspace_id
    left join public.work_items item
      on item.id = plan_item.work_item_id
      and item.workspace_id = plan_item.workspace_id
    where plan.workspace_id = personal_workspace_id
      and plan.work_date between chosen_start_date and chosen_end_date
    group by plan.id, plan.work_date, plan.intention, plan.status
  ),
  attended_meeting_metrics as (
    select
      event.start_local_date as report_date,
      count(distinct coalesce(event.ical_uid, event.id::text)) as meetings_attended
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
    group by event.start_local_date
  ),
  scheduled_meeting_metrics as (
    select
      event.start_local_date as report_date,
      count(distinct coalesce(event.ical_uid, event.id::text)) as scheduled_meetings
    from public.external_calendar_events event
    join public.external_calendars calendar
      on calendar.id = event.external_calendar_id
      and calendar.workspace_id = event.workspace_id
      and calendar.is_selected
    where event.workspace_id = personal_workspace_id
      and event.event_type = 'default'
      and event.status <> 'cancelled'
      and event.start_local_date between chosen_start_date and chosen_end_date
    group by event.start_local_date
  ),
  note_metrics as (
    select note.work_date as report_date, note.body, note.is_important
    from public.day_notes note
    where note.workspace_id = personal_workspace_id
      and note.work_date between chosen_start_date and chosen_end_date
  ),
  ooo_metrics as (
    select distinct non_working.work_date as report_date
    from public.non_working_days non_working
    where non_working.workspace_id = personal_workspace_id
      and non_working.kind = 'out_of_office'
      and non_working.work_date between chosen_start_date and chosen_end_date
  )
  select
    date.report_date,
    coalesce(work.tickets_worked, 0),
    coalesce(status.tickets_resolved, 0),
    coalesce(status.tickets_closed, 0),
    coalesce(work.tasks_completed, 0),
    coalesce(work.reminders_completed, 0),
    coalesce(attended_meeting.meetings_attended, 0),
    coalesce(scheduled_meeting.scheduled_meetings, 0),
    coalesce(plan.planned_items, 0),
    coalesce(plan.planned_tickets, 0),
    coalesce(plan.planned_tasks, 0),
    coalesce(plan.planned_reminders, 0),
    coalesce(plan.completed_items, 0),
    coalesce(plan.returned_items, 0),
    coalesce(plan.deferred_items, 0),
    coalesce(plan.skipped_items, 0),
    coalesce(note.is_important, false),
    note.body,
    ooo.report_date is not null,
    plan.intention,
    plan.status
  from report_dates date
  left join work_metrics work on work.report_date = date.report_date
  left join status_metrics status on status.report_date = date.report_date
  left join plan_metrics plan on plan.report_date = date.report_date
  left join attended_meeting_metrics attended_meeting
    on attended_meeting.report_date = date.report_date
  left join scheduled_meeting_metrics scheduled_meeting
    on scheduled_meeting.report_date = date.report_date
  left join note_metrics note on note.report_date = date.report_date
  left join ooo_metrics ooo on ooo.report_date = date.report_date
  order by date.report_date;
end;
$$;

revoke all on function public.reporting_daily_metrics(date, date) from public;
grant execute on function public.reporting_daily_metrics(date, date) to authenticated;
