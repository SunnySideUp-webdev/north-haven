do $$
declare
  updated_ticket_count integer;
begin
  update public.ticket_details as ticket
  set operational_status = 'resolved'::public.ticket_operational_status,
      resolved_at = coalesce(
        ticket.resolved_at,
        plan_item.completed_at,
        now()
      )
  from public.daily_plan_items as plan_item
  join public.daily_plans as plan
    on plan.id = plan_item.daily_plan_id
   and plan.workspace_id = plan_item.workspace_id
  where ticket.work_item_id = plan_item.work_item_id
    and ticket.workspace_id = plan_item.workspace_id
    and plan.work_date = date '2026-08-21'
    and plan_item.execution_status = 'done'
    and (
      ticket.operational_status is distinct from 'resolved'
      or ticket.resolved_at is null
    );

  get diagnostics updated_ticket_count = row_count;
  raise notice 'Synchronized % completed tickets for 2026-08-21.',
    updated_ticket_count;
end;
$$;
