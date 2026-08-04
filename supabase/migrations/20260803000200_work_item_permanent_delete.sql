drop function if exists public.remove_daily_plan_item(uuid);
drop function if exists public.move_daily_plan_item_to_date(uuid, date);

create or replace function public.delete_work_item_permanently(
  target_work_item_id uuid
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  personal_workspace_id uuid;
begin
  personal_workspace_id := public.current_personal_workspace_id();

  delete from public.work_items
  where id = target_work_item_id
    and workspace_id = personal_workspace_id;

  if not found then
    raise exception 'Work item not found.';
  end if;
end;
$$;

revoke all on function public.delete_work_item_permanently(uuid) from public;
grant execute on function public.delete_work_item_permanently(uuid) to authenticated;
