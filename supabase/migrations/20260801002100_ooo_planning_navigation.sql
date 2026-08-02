create or replace function public.next_plannable_date(chosen_after_date date)
returns date
language plpgsql stable security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  candidate date := chosen_after_date + 1;
  working_days smallint[];
begin
  personal_workspace_id := public.current_personal_workspace_id();
  select working_weekdays into working_days
  from public.work_schedules
  where workspace_id = personal_workspace_id;
  working_days := coalesce(working_days, array[1, 2, 3, 4, 5]::smallint[]);

  for attempt in 1..370 loop
    if extract(isodow from candidate)::smallint = any(working_days)
      and not exists (
        select 1
        from public.non_working_days
        where workspace_id = personal_workspace_id
          and work_date = candidate
          and kind <> 'out_of_office'
      ) then
      return candidate;
    end if;
    candidate := candidate + 1;
  end loop;

  raise exception 'A next planning date could not be calculated.';
end;
$$;

create or replace function public.previous_plannable_date(chosen_before_date date)
returns date
language plpgsql stable security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  candidate date := chosen_before_date - 1;
  working_days smallint[];
begin
  personal_workspace_id := public.current_personal_workspace_id();
  select working_weekdays into working_days
  from public.work_schedules
  where workspace_id = personal_workspace_id;
  working_days := coalesce(working_days, array[1, 2, 3, 4, 5]::smallint[]);

  for attempt in 1..370 loop
    if extract(isodow from candidate)::smallint = any(working_days)
      and not exists (
        select 1
        from public.non_working_days
        where workspace_id = personal_workspace_id
          and work_date = candidate
          and kind <> 'out_of_office'
      ) then
      return candidate;
    end if;
    candidate := candidate - 1;
  end loop;

  raise exception 'A previous planning date could not be calculated.';
end;
$$;

revoke all on function public.next_plannable_date(date) from public;
revoke all on function public.previous_plannable_date(date) from public;
grant execute on function public.next_plannable_date(date) to authenticated;
grant execute on function public.previous_plannable_date(date) to authenticated;
