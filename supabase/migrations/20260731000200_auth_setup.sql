alter table public.profiles
  add column setup_completed_at timestamptz;

create or replace function public.complete_initial_setup(
  chosen_display_name text,
  chosen_time_zone text,
  chosen_working_weekdays smallint[],
  chosen_starts_at_local time,
  chosen_ends_at_local time
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.';
  end if;

  if char_length(trim(chosen_display_name)) not between 1 and 80 then
    raise exception 'Display name must contain between 1 and 80 characters.';
  end if;

  if chosen_time_zone is null or char_length(trim(chosen_time_zone)) = 0 then
    raise exception 'A time zone is required.';
  end if;

  if cardinality(chosen_working_weekdays) = 0
    or chosen_working_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[] is false then
    raise exception 'Choose at least one valid workday.';
  end if;

  if chosen_ends_at_local <= chosen_starts_at_local then
    raise exception 'The workday end must be later than the start.';
  end if;

  select workspace_id
  into personal_workspace_id
  from public.workspace_members
  where profile_id = (select auth.uid())
    and role = 'owner'
  order by created_at
  limit 1;

  if personal_workspace_id is null then
    raise exception 'A personal workspace was not found.';
  end if;

  update public.profiles
  set display_name = trim(chosen_display_name),
      time_zone = chosen_time_zone,
      setup_completed_at = now(),
      updated_at = now()
  where id = (select auth.uid());

  update public.work_schedules
  set working_weekdays = chosen_working_weekdays,
      starts_at_local = chosen_starts_at_local,
      ends_at_local = chosen_ends_at_local,
      time_zone = chosen_time_zone
  where workspace_id = personal_workspace_id;
end;
$$;

revoke all on function public.complete_initial_setup(text, text, smallint[], time, time)
  from public;
grant execute on function public.complete_initial_setup(text, text, smallint[], time, time)
  to authenticated;
