create unique index ticket_types_workspace_normalized_name_idx
  on public.ticket_types (workspace_id, lower(trim(name)));

create or replace function public.create_ticket_type(chosen_name text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  new_ticket_type_id uuid;
  next_sort_order integer;
begin
  personal_workspace_id := public.current_personal_workspace_id();

  select coalesce(max(sort_order), 0) + 10 into next_sort_order
  from public.ticket_types
  where workspace_id = personal_workspace_id;

  insert into public.ticket_types (workspace_id, name, sort_order)
  values (personal_workspace_id, trim(chosen_name), next_sort_order)
  returning id into new_ticket_type_id;

  return new_ticket_type_id;
end;
$$;

create or replace function public.update_ticket_type(
  target_ticket_type_id uuid,
  chosen_name text,
  chosen_is_active boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  active_type_count integer;
begin
  personal_workspace_id := public.current_personal_workspace_id();

  if not chosen_is_active then
    select count(*) into active_type_count
    from public.ticket_types
    where workspace_id = personal_workspace_id
      and is_active
      and id <> target_ticket_type_id;

    if active_type_count = 0 then
      raise exception 'Keep at least one active ticket type.';
    end if;
  end if;

  update public.ticket_types
  set name = trim(chosen_name),
      is_active = chosen_is_active
  where id = target_ticket_type_id
    and workspace_id = personal_workspace_id;

  if not found then
    raise exception 'Ticket type not found.';
  end if;
end;
$$;

create or replace function public.move_ticket_type(
  target_ticket_type_id uuid,
  chosen_direction integer
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  target_sort_order integer;
  adjacent_ticket_type_id uuid;
  adjacent_sort_order integer;
begin
  if chosen_direction not in (-1, 1) then
    raise exception 'Direction must be -1 or 1.';
  end if;

  personal_workspace_id := public.current_personal_workspace_id();

  select sort_order into target_sort_order
  from public.ticket_types
  where id = target_ticket_type_id
    and workspace_id = personal_workspace_id;

  if target_sort_order is null then
    raise exception 'Ticket type not found.';
  end if;

  if chosen_direction = -1 then
    select id, sort_order into adjacent_ticket_type_id, adjacent_sort_order
    from public.ticket_types
    where workspace_id = personal_workspace_id
      and (sort_order, id) < (target_sort_order, target_ticket_type_id)
    order by sort_order desc, id desc
    limit 1;
  else
    select id, sort_order into adjacent_ticket_type_id, adjacent_sort_order
    from public.ticket_types
    where workspace_id = personal_workspace_id
      and (sort_order, id) > (target_sort_order, target_ticket_type_id)
    order by sort_order, id
    limit 1;
  end if;

  if adjacent_ticket_type_id is null then
    return;
  end if;

  update public.ticket_types
  set sort_order = case
    when id = target_ticket_type_id then adjacent_sort_order
    when id = adjacent_ticket_type_id then target_sort_order
  end
  where id in (target_ticket_type_id, adjacent_ticket_type_id)
    and workspace_id = personal_workspace_id;
end;
$$;

create or replace function public.transition_follow_up(
  target_follow_up_id uuid,
  chosen_state public.follow_up_state
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
begin
  if chosen_state = 'open' then
    raise exception 'Use the follow-up form to keep an item open.';
  end if;

  personal_workspace_id := public.current_personal_workspace_id();

  update public.follow_ups
  set state = chosen_state,
      completed_at = now()
  where id = target_follow_up_id
    and workspace_id = personal_workspace_id
    and state = 'open';

  if not found then
    raise exception 'Open follow-up not found.';
  end if;
end;
$$;

revoke all on function public.create_ticket_type(text) from public;
revoke all on function public.update_ticket_type(uuid, text, boolean) from public;
revoke all on function public.move_ticket_type(uuid, integer) from public;
revoke all on function public.transition_follow_up(uuid, public.follow_up_state) from public;

grant execute on function public.create_ticket_type(text) to authenticated;
grant execute on function public.update_ticket_type(uuid, text, boolean) to authenticated;
grant execute on function public.move_ticket_type(uuid, integer) to authenticated;
grant execute on function public.transition_follow_up(uuid, public.follow_up_state) to authenticated;
