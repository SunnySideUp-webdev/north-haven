create type public.follow_up_decision as enum (
  'still_waiting',
  'response_received',
  'external_completed',
  'no_longer_relevant'
);

create or replace function public.set_end_of_day_step(chosen_work_date date, chosen_step integer)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  target_plan_id uuid;
begin
  if chosen_step not between 1 and 4 then raise exception 'Invalid End of Day step.'; end if;
  personal_workspace_id := public.current_personal_workspace_id();
  insert into public.daily_plans (workspace_id, work_date, end_of_day_step)
  values (personal_workspace_id, chosen_work_date, chosen_step)
  on conflict (workspace_id, work_date) do update set end_of_day_step = chosen_step
  returning id into target_plan_id;
  return target_plan_id;
end;
$$;

create or replace function public.save_day_note(
  chosen_work_date date,
  chosen_body text,
  chosen_is_important boolean
)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare personal_workspace_id uuid;
begin
  personal_workspace_id := public.current_personal_workspace_id();
  if nullif(trim(chosen_body), '') is null then
    delete from public.day_notes where workspace_id = personal_workspace_id and work_date = chosen_work_date;
  else
    insert into public.day_notes (workspace_id, work_date, body, is_important)
    values (personal_workspace_id, chosen_work_date, trim(chosen_body), chosen_is_important)
    on conflict (workspace_id, work_date) do update
      set body = excluded.body, is_important = excluded.is_important;
  end if;
end;
$$;

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
begin
  if chosen_outcome = 'worked' then raise exception 'Choose a final outcome.'; end if;
  personal_workspace_id := public.current_personal_workspace_id();
  select * into target_item from public.daily_plan_items
  where id = target_daily_plan_item_id and workspace_id = personal_workspace_id;
  if target_item.id is null then raise exception 'Plan item not found.'; end if;
  select work_date into source_date from public.daily_plans where id = target_item.daily_plan_id;

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

  insert into public.work_logs (workspace_id, work_item_id, daily_plan_item_id, worked_on, started_at, ended_at, outcome)
  values (personal_workspace_id, target_item.work_item_id, target_item.id, source_date, coalesce(target_item.started_at, now()), now(), chosen_outcome)
  on conflict (daily_plan_item_id) do update
    set ended_at = excluded.ended_at, outcome = excluded.outcome;
end;
$$;

create or replace function public.resolve_end_of_day_follow_up(
  target_follow_up_id uuid,
  chosen_decision public.follow_up_decision,
  chosen_review_on date default null
)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  target_follow_up public.follow_ups%rowtype;
begin
  personal_workspace_id := public.current_personal_workspace_id();
  select * into target_follow_up from public.follow_ups
  where id = target_follow_up_id and workspace_id = personal_workspace_id and state = 'open';
  if target_follow_up.id is null then raise exception 'Open follow-up not found.'; end if;

  if chosen_decision = 'still_waiting' then
    if chosen_review_on is null or chosen_review_on <= current_date then
      raise exception 'Choose a future review date.';
    end if;
    update public.follow_ups set review_on = chosen_review_on where id = target_follow_up.id;
  elsif chosen_decision = 'response_received' then
    update public.follow_ups set state = 'completed', completed_at = now() where id = target_follow_up.id;
    update public.work_items set tracking_state = 'active', archived_at = null
    where id = target_follow_up.work_item_id and workspace_id = personal_workspace_id;
  elsif chosen_decision = 'external_completed' then
    update public.follow_ups set state = 'completed', completed_at = now() where id = target_follow_up.id;
    update public.work_items set tracking_state = 'closed', archived_at = null
    where id = target_follow_up.work_item_id and workspace_id = personal_workspace_id;
    update public.ticket_details set closed_at = coalesce(closed_at, now())
    where work_item_id = target_follow_up.work_item_id and workspace_id = personal_workspace_id;
  else
    update public.follow_ups set state = 'cancelled', completed_at = now() where id = target_follow_up.id;
  end if;
end;
$$;

create or replace function public.finish_end_of_day(chosen_work_date date)
returns date
language plpgsql security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  current_plan_id uuid;
  next_date date;
begin
  personal_workspace_id := public.current_personal_workspace_id();
  select id into current_plan_id from public.daily_plans
  where workspace_id = personal_workspace_id and work_date = chosen_work_date;
  if current_plan_id is null then raise exception 'Daily plan not found.'; end if;
  if exists (select 1 from public.daily_plan_items where daily_plan_id = current_plan_id and execution_status in ('planned', 'in_progress')) then
    raise exception 'Every planned item needs an outcome.';
  end if;
  if exists (select 1 from public.follow_ups where workspace_id = personal_workspace_id and state = 'open' and review_on <= chosen_work_date) then
    raise exception 'Every due follow-up needs a decision.';
  end if;
  next_date := public.next_workday(chosen_work_date);
  if not exists (select 1 from public.daily_plans where workspace_id = personal_workspace_id and work_date = next_date and status = 'ready') then
    raise exception 'The next workday plan must be Ready.';
  end if;
  update public.daily_plans set status = 'closed', closed_at = now(), end_of_day_step = 4
  where id = current_plan_id;
  return next_date;
end;
$$;

revoke all on function public.set_end_of_day_step(date, integer) from public;
revoke all on function public.save_day_note(date, text, boolean) from public;
revoke all on function public.apply_end_of_day_outcome(uuid, public.work_log_outcome, date) from public;
revoke all on function public.resolve_end_of_day_follow_up(uuid, public.follow_up_decision, date) from public;
revoke all on function public.finish_end_of_day(date) from public;
grant execute on function public.set_end_of_day_step(date, integer) to authenticated;
grant execute on function public.save_day_note(date, text, boolean) to authenticated;
grant execute on function public.apply_end_of_day_outcome(uuid, public.work_log_outcome, date) to authenticated;
grant execute on function public.resolve_end_of_day_follow_up(uuid, public.follow_up_decision, date) to authenticated;
grant execute on function public.finish_end_of_day(date) to authenticated;
