create or replace function public.remove_daily_plan_item(
  target_daily_plan_item_id uuid
)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  target_item public.daily_plan_items%rowtype;
begin
  personal_workspace_id := public.current_personal_workspace_id();

  select * into target_item
  from public.daily_plan_items
  where id = target_daily_plan_item_id
    and workspace_id = personal_workspace_id;

  if target_item.id is null then
    raise exception 'Plan item not found.';
  end if;

  if target_item.execution_status <> 'planned' then
    raise exception 'Only planned work can be removed.';
  end if;

  delete from public.daily_plan_items
  where id = target_item.id
    and workspace_id = personal_workspace_id;

  with reordered as (
    select id, row_number() over (order by position, id) - 1 as new_position
    from public.daily_plan_items
    where daily_plan_id = target_item.daily_plan_id
      and workspace_id = personal_workspace_id
  )
  update public.daily_plan_items
  set position = reordered.new_position + 100000
  from reordered
  where public.daily_plan_items.id = reordered.id;

  update public.daily_plan_items
  set position = position - 100000
  where daily_plan_id = target_item.daily_plan_id
    and workspace_id = personal_workspace_id;

  update public.daily_plans
  set status = 'draft', ready_at = null
  where id = target_item.daily_plan_id
    and workspace_id = personal_workspace_id
    and status in ('ready', 'active');
end;
$$;

create or replace function public.move_daily_plan_item_to_date(
  target_daily_plan_item_id uuid,
  chosen_work_date date
)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  source_item public.daily_plan_items%rowtype;
  source_work_date date;
  target_plan_id uuid;
  target_plan_status public.daily_plan_status;
  next_position integer;
begin
  if chosen_work_date is null then
    raise exception 'Choose a work date.';
  end if;

  personal_workspace_id := public.current_personal_workspace_id();

  select * into source_item
  from public.daily_plan_items
  where id = target_daily_plan_item_id
    and workspace_id = personal_workspace_id;

  if source_item.id is null then
    raise exception 'Plan item not found.';
  end if;

  if source_item.execution_status <> 'planned' then
    raise exception 'Only planned work can be moved.';
  end if;

  select work_date into source_work_date
  from public.daily_plans
  where id = source_item.daily_plan_id
    and workspace_id = personal_workspace_id;

  if source_work_date = chosen_work_date then
    raise exception 'Choose a different work date.';
  end if;

  if exists (
    select 1
    from public.work_items
    where id = source_item.work_item_id
      and workspace_id = personal_workspace_id
      and tracking_state = 'archived'
  ) then
    raise exception 'Archived work cannot be moved into a plan.';
  end if;

  insert into public.daily_plans (workspace_id, work_date)
  values (personal_workspace_id, chosen_work_date)
  on conflict (workspace_id, work_date) do update
    set status = case
          when public.daily_plans.status in ('ready', 'active') then 'draft'::public.daily_plan_status
          else public.daily_plans.status
        end,
        ready_at = case
          when public.daily_plans.status in ('ready', 'active') then null
          else public.daily_plans.ready_at
        end
  returning id, status into target_plan_id, target_plan_status;

  if target_plan_status = 'closed' then
    raise exception 'Closed plans cannot receive moved work.';
  end if;

  if exists (
    select 1
    from public.daily_plan_items
    where daily_plan_id = target_plan_id
      and workspace_id = personal_workspace_id
      and work_item_id = source_item.work_item_id
  ) then
    raise exception 'This item is already planned for that day.';
  end if;

  select coalesce(max(position), -1) + 1 into next_position
  from public.daily_plan_items
  where daily_plan_id = target_plan_id
    and workspace_id = personal_workspace_id;

  insert into public.daily_plan_items (
    workspace_id, daily_plan_id, work_item_id, position
  )
  values (
    personal_workspace_id, target_plan_id, source_item.work_item_id, next_position
  );

  delete from public.daily_plan_items
  where id = source_item.id
    and workspace_id = personal_workspace_id;

  with reordered as (
    select id, row_number() over (order by position, id) - 1 as new_position
    from public.daily_plan_items
    where daily_plan_id = source_item.daily_plan_id
      and workspace_id = personal_workspace_id
  )
  update public.daily_plan_items
  set position = reordered.new_position + 100000
  from reordered
  where public.daily_plan_items.id = reordered.id;

  update public.daily_plan_items
  set position = position - 100000
  where daily_plan_id = source_item.daily_plan_id
    and workspace_id = personal_workspace_id;

  update public.daily_plans
  set status = 'draft', ready_at = null
  where workspace_id = personal_workspace_id
    and id in (source_item.daily_plan_id, target_plan_id)
    and status in ('ready', 'active');

  return target_plan_id;
end;
$$;

revoke all on function public.remove_daily_plan_item(uuid) from public;
revoke all on function public.move_daily_plan_item_to_date(uuid, date) from public;
grant execute on function public.remove_daily_plan_item(uuid) to authenticated;
grant execute on function public.move_daily_plan_item_to_date(uuid, date) to authenticated;
