create or replace function public.update_ticket_workflow(
  target_work_item_id uuid,
  chosen_system_priority public.ticket_priority,
  chosen_operational_status public.ticket_operational_status,
  chosen_tracking_state public.work_tracking_state
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
begin
  personal_workspace_id := public.current_personal_workspace_id();

  if chosen_tracking_state = 'archived' and exists (
    select 1
    from public.daily_plan_items
    join public.daily_plans on daily_plans.id = daily_plan_items.daily_plan_id
    where daily_plan_items.workspace_id = personal_workspace_id
      and daily_plan_items.work_item_id = target_work_item_id
      and daily_plan_items.execution_status in ('planned', 'in_progress')
      and daily_plans.status in ('draft', 'ready', 'active')
  ) then
    raise exception 'Remove this item from open daily plans before archiving it.';
  end if;

  update public.work_items
  set tracking_state = chosen_tracking_state,
      archived_at = case
        when chosen_tracking_state = 'archived' then coalesce(archived_at, now())
        else null
      end
  where id = target_work_item_id
    and workspace_id = personal_workspace_id
    and kind = 'ticket';

  if not found then
    raise exception 'Ticket not found.';
  end if;

  update public.ticket_details
  set system_priority = chosen_system_priority,
      operational_status = chosen_operational_status,
      resolved_at = case
        when chosen_operational_status = 'resolved' then coalesce(resolved_at, now())
        else resolved_at
      end,
      closed_at = case
        when chosen_tracking_state = 'closed' then coalesce(closed_at, now())
        else null
      end
  where work_item_id = target_work_item_id
    and workspace_id = personal_workspace_id;

  if not found then
    raise exception 'Ticket details not found.';
  end if;
end;
$$;

revoke all on function public.update_ticket_workflow(
  uuid,
  public.ticket_priority,
  public.ticket_operational_status,
  public.work_tracking_state
) from public;

grant execute on function public.update_ticket_workflow(
  uuid,
  public.ticket_priority,
  public.ticket_operational_status,
  public.work_tracking_state
) to authenticated;
