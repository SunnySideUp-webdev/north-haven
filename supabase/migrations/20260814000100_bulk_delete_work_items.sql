create or replace function public.bulk_delete_work_items_permanently(
  target_work_item_ids uuid[]
)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  deleted_count integer;
begin
  if coalesce(cardinality(target_work_item_ids), 0) = 0
    or cardinality(target_work_item_ids) > 100 then
    raise exception 'Choose between 1 and 100 items.';
  end if;

  personal_workspace_id := public.current_personal_workspace_id();

  delete from public.work_items
  where workspace_id = personal_workspace_id
    and id in (
      select distinct unnest(target_work_item_ids)
    );

  get diagnostics deleted_count = row_count;

  if deleted_count = 0 then
    raise exception 'Work items not found.';
  end if;

  return deleted_count;
end;
$$;

revoke all on function public.bulk_delete_work_items_permanently(uuid[]) from public;
grant execute on function public.bulk_delete_work_items_permanently(uuid[]) to authenticated;
