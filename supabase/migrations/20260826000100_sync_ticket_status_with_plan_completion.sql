create or replace function public.sync_ticket_status_from_plan_completion()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.execution_status is not distinct from new.execution_status
    or new.execution_status not in ('done', 'in_progress') then
    return new;
  end if;

  update public.ticket_details
  set operational_status = case
        when new.execution_status = 'done'
          then 'resolved'::public.ticket_operational_status
        else 'in_progress'::public.ticket_operational_status
      end,
      resolved_at = case
        when new.execution_status = 'done' then coalesce(resolved_at, now())
        else null
      end
  where work_item_id = new.work_item_id
    and workspace_id = new.workspace_id;

  return new;
end;
$$;

drop trigger if exists daily_plan_items_sync_ticket_status
  on public.daily_plan_items;

create trigger daily_plan_items_sync_ticket_status
  after update of execution_status on public.daily_plan_items
  for each row
  execute function public.sync_ticket_status_from_plan_completion();

create or replace function public.set_daily_plan_item_done(
  target_daily_plan_item_id uuid,
  chosen_done boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  target_item public.daily_plan_items%rowtype;
  target_work_date date;
begin
  personal_workspace_id := public.current_personal_workspace_id();

  select * into target_item
  from public.daily_plan_items
  where id = target_daily_plan_item_id
    and workspace_id = personal_workspace_id;

  if target_item.id is null then
    raise exception 'Plan item not found.';
  end if;

  select work_date into target_work_date
  from public.daily_plans
  where id = target_item.daily_plan_id;

  update public.daily_plan_items
  set execution_status = case
        when chosen_done then 'done'::public.plan_execution_status
        else 'in_progress'::public.plan_execution_status
      end,
      started_at = case
        when chosen_done then coalesce(started_at, now())
        else started_at
      end,
      completed_at = case when chosen_done then now() else null end
  where id = target_item.id;

  if chosen_done then
    insert into public.work_logs (
      workspace_id,
      work_item_id,
      daily_plan_item_id,
      worked_on,
      started_at,
      ended_at,
      outcome
    )
    values (
      personal_workspace_id,
      target_item.work_item_id,
      target_item.id,
      target_work_date,
      coalesce(target_item.started_at, now()),
      now(),
      'done'
    )
    on conflict (daily_plan_item_id) do update
      set ended_at = excluded.ended_at,
          outcome = excluded.outcome;

    update public.daily_plans
    set status = case when status = 'ready' then 'active' else status end
    where id = target_item.daily_plan_id;
  else
    update public.work_logs
    set ended_at = null,
        outcome = 'worked'
    where daily_plan_item_id = target_item.id
      and workspace_id = personal_workspace_id;
  end if;
end;
$$;

revoke all on function public.sync_ticket_status_from_plan_completion()
  from public;
revoke all on function public.set_daily_plan_item_done(uuid, boolean)
  from public;

grant execute on function public.set_daily_plan_item_done(uuid, boolean)
  to authenticated;
