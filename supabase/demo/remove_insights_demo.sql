-- Removes only the local synthetic Insights records created by insights_demo.sql.

begin;

do $$
declare
  target_workspace_id uuid;
begin
  select connection.workspace_id into target_workspace_id
  from public.calendar_connections connection
  where connection.status = 'connected'
  order by connection.updated_at desc
  limit 1;

  if target_workspace_id is null then
    raise exception 'A connected local workspace is required to remove the Insights demo.';
  end if;

  delete from public.work_logs
  where workspace_id = target_workspace_id
    and work_item_id in (
      select details.work_item_id
      from public.ticket_details details
      where details.workspace_id = target_workspace_id
        and details.normalized_ticket_number like 'DEMO-INSIGHT-%'
    );

  delete from public.daily_plans
  where workspace_id = target_workspace_id
    and intention like '[DEMO] Insights preview%';

  delete from public.day_notes
  where workspace_id = target_workspace_id
    and body like '[DEMO] Insights preview%';

  delete from public.work_items item
  where item.workspace_id = target_workspace_id
    and item.id in (
      select details.work_item_id
      from public.ticket_details details
      where details.workspace_id = target_workspace_id
        and details.normalized_ticket_number like 'DEMO-INSIGHT-%'
    );
end;
$$;

commit;
