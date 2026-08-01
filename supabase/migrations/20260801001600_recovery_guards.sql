create or replace function public.validate_profile_recovery_settings()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if char_length(trim(new.display_name)) not between 1 and 80 then
    raise exception 'Choose a display name between 1 and 80 characters.';
  end if;
  if not exists (
    select 1 from pg_catalog.pg_timezone_names where name = trim(new.time_zone)
  ) then
    raise exception 'Choose a valid IANA time zone.';
  end if;
  return new;
end;
$$;

create or replace function public.validate_schedule_recovery_settings()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not exists (
    select 1 from pg_catalog.pg_timezone_names where name = trim(new.time_zone)
  ) then
    raise exception 'Choose a valid IANA time zone.';
  end if;
  if cardinality(new.working_weekdays) = 0
    or new.working_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[] is false then
    raise exception 'Choose at least one valid workday.';
  end if;
  return new;
end;
$$;

create trigger profiles_validate_recovery_settings
  before insert or update of display_name, time_zone on public.profiles
  for each row execute procedure public.validate_profile_recovery_settings();

create trigger schedules_validate_recovery_settings
  before insert or update of working_weekdays, time_zone on public.work_schedules
  for each row execute procedure public.validate_schedule_recovery_settings();

create or replace function public.apply_end_of_day_outcome(
  target_daily_plan_item_id uuid,
  chosen_outcome public.work_log_outcome,
  chosen_deferred_date date default null
)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  target_item public.daily_plan_items%rowtype;
  source_date date;
  target_status public.plan_execution_status;
  deferred_plan_id uuid;
  next_position integer;
  previous_outcome public.work_log_outcome;
begin
  if chosen_outcome = 'worked' then raise exception 'Choose a final outcome.'; end if;
  personal_workspace_id := public.current_personal_workspace_id();
  select * into target_item from public.daily_plan_items
  where id = target_daily_plan_item_id and workspace_id = personal_workspace_id;
  if target_item.id is null then raise exception 'Plan item not found.'; end if;
  select work_date into source_date from public.daily_plans where id = target_item.daily_plan_id;
  select outcome into previous_outcome from public.work_logs
  where daily_plan_item_id = target_item.id;

  if target_item.deferred_to_plan_id is not null then
    delete from public.daily_plan_items
    where daily_plan_id = target_item.deferred_to_plan_id
      and work_item_id = target_item.work_item_id
      and execution_status = 'planned';
  end if;

  if previous_outcome in ('watching', 'skipped')
    and chosen_outcome not in ('watching', 'skipped') then
    update public.work_items set tracking_state = 'active', archived_at = null
    where id = target_item.work_item_id and workspace_id = personal_workspace_id;
  end if;

  if chosen_outcome = 'deferred' then
    if chosen_deferred_date is null or chosen_deferred_date <= source_date then
      raise exception 'Choose a future work date.';
    end if;
    insert into public.daily_plans (workspace_id, work_date)
    values (personal_workspace_id, chosen_deferred_date)
    on conflict (workspace_id, work_date) do update set status = case
      when public.daily_plans.status in ('ready', 'active') then 'draft'::public.daily_plan_status
      else public.daily_plans.status end,
      ready_at = case when public.daily_plans.status in ('ready', 'active') then null else public.daily_plans.ready_at end
    returning id into deferred_plan_id;
    select coalesce(max(position), -1) + 1 into next_position
    from public.daily_plan_items where daily_plan_id = deferred_plan_id;
    insert into public.daily_plan_items (workspace_id, daily_plan_id, work_item_id, position)
    values (personal_workspace_id, deferred_plan_id, target_item.work_item_id, next_position)
    on conflict (daily_plan_id, work_item_id) do nothing;
  end if;

  target_status := case chosen_outcome
    when 'done' then 'done'::public.plan_execution_status
    when 'returned' then 'returned'::public.plan_execution_status
    when 'deferred' then 'deferred'::public.plan_execution_status
    when 'watching' then 'returned'::public.plan_execution_status
    when 'skipped' then 'skipped'::public.plan_execution_status
    else 'returned'::public.plan_execution_status end;

  update public.daily_plan_items
  set execution_status = target_status,
      started_at = coalesce(started_at, now()),
      completed_at = now(),
      deferred_to_plan_id = deferred_plan_id
  where id = target_item.id;

  if chosen_outcome = 'watching' then
    update public.work_items set tracking_state = 'watching', archived_at = null
    where id = target_item.work_item_id and workspace_id = personal_workspace_id;
  elsif chosen_outcome = 'skipped' then
    update public.work_items set tracking_state = 'archived', archived_at = now()
    where id = target_item.work_item_id and workspace_id = personal_workspace_id;
  end if;

  insert into public.work_logs (
    workspace_id, work_item_id, daily_plan_item_id, worked_on,
    started_at, ended_at, outcome
  )
  values (
    personal_workspace_id, target_item.work_item_id, target_item.id,
    source_date, coalesce(target_item.started_at, now()), now(), chosen_outcome
  )
  on conflict (daily_plan_item_id) do update
    set ended_at = excluded.ended_at, outcome = excluded.outcome;
end;
$$;

revoke all on function public.validate_profile_recovery_settings() from public;
revoke all on function public.validate_schedule_recovery_settings() from public;
revoke all on function public.apply_end_of_day_outcome(uuid, public.work_log_outcome, date) from public;
grant execute on function public.apply_end_of_day_outcome(uuid, public.work_log_outcome, date) to authenticated;
