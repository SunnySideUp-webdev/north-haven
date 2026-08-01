alter type public.status_dimension add value if not exists 'execution';

create type public.daily_plan_status as enum ('draft', 'ready', 'active', 'closed');
create type public.plan_execution_status as enum ('planned', 'in_progress', 'done', 'returned', 'deferred', 'skipped');
create type public.work_log_outcome as enum ('worked', 'done', 'returned', 'deferred', 'watching', 'skipped');
create type public.non_working_day_kind as enum ('out_of_office', 'holiday', 'manual');
create type public.non_working_day_source as enum ('google', 'manual');

create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  work_date date not null,
  status public.daily_plan_status not null default 'draft',
  intention text check (intention is null or char_length(intention) <= 240),
  ready_at timestamptz,
  closed_at timestamptz,
  end_of_day_step integer not null default 0 check (end_of_day_step between 0 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  unique (workspace_id, work_date),
  constraint daily_plan_status_timestamps check (
    (status = 'closed' and closed_at is not null)
    or (status <> 'closed' and closed_at is null)
  )
);

create table public.daily_plan_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  daily_plan_id uuid not null,
  work_item_id uuid not null,
  position integer not null check (position >= 0),
  execution_status public.plan_execution_status not null default 'planned',
  started_at timestamptz,
  completed_at timestamptz,
  outcome_note text check (outcome_note is null or char_length(outcome_note) <= 1000),
  deferred_to_plan_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (daily_plan_id, workspace_id) references public.daily_plans (id, workspace_id) on delete cascade,
  foreign key (work_item_id, workspace_id) references public.work_items (id, workspace_id),
  foreign key (deferred_to_plan_id, workspace_id) references public.daily_plans (id, workspace_id),
  unique (id, workspace_id),
  unique (daily_plan_id, work_item_id),
  unique (daily_plan_id, position)
);

create table public.work_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  work_item_id uuid not null,
  daily_plan_item_id uuid,
  worked_on date not null,
  started_at timestamptz,
  ended_at timestamptz,
  outcome public.work_log_outcome not null,
  is_automatic boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (work_item_id, workspace_id) references public.work_items (id, workspace_id),
  foreign key (daily_plan_item_id, workspace_id) references public.daily_plan_items (id, workspace_id),
  unique (daily_plan_item_id)
);

create table public.day_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  work_date date not null,
  body text not null check (char_length(trim(body)) between 1 and 10000),
  is_important boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, work_date)
);

create table public.non_working_days (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  work_date date not null,
  kind public.non_working_day_kind not null,
  source public.non_working_day_source not null,
  source_event_id text,
  allows_urgent_work boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_id, work_date, kind, source)
);

create index daily_plans_workspace_date_idx on public.daily_plans (workspace_id, work_date desc);
create index daily_plan_items_plan_position_idx on public.daily_plan_items (daily_plan_id, position);
create index work_logs_workspace_date_idx on public.work_logs (workspace_id, worked_on desc);
create index non_working_days_workspace_date_idx on public.non_working_days (workspace_id, work_date);

create trigger daily_plans_set_updated_at before update on public.daily_plans
  for each row execute procedure public.set_updated_at();
create trigger daily_plan_items_set_updated_at before update on public.daily_plan_items
  for each row execute procedure public.set_updated_at();
create trigger day_notes_set_updated_at before update on public.day_notes
  for each row execute procedure public.set_updated_at();

create or replace function public.next_workday(chosen_after_date date)
returns date
language plpgsql stable security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  candidate date := chosen_after_date + 1;
  working_days smallint[];
begin
  personal_workspace_id := public.current_personal_workspace_id();
  select working_weekdays into working_days from public.work_schedules
  where workspace_id = personal_workspace_id;
  working_days := coalesce(working_days, array[1, 2, 3, 4, 5]::smallint[]);

  for attempt in 1..370 loop
    if extract(isodow from candidate)::smallint = any(working_days)
      and not exists (
        select 1 from public.non_working_days
        where workspace_id = personal_workspace_id and work_date = candidate
      ) then return candidate; end if;
    candidate := candidate + 1;
  end loop;
  raise exception 'A next workday could not be calculated.';
end;
$$;

create or replace function public.set_plan_item_selected(
  chosen_work_date date,
  target_work_item_id uuid,
  chosen_selected boolean
)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  target_plan_id uuid;
  next_position integer;
begin
  personal_workspace_id := public.current_personal_workspace_id();
  insert into public.daily_plans (workspace_id, work_date)
  values (personal_workspace_id, chosen_work_date)
  on conflict (workspace_id, work_date) do update
    set status = case when public.daily_plans.status in ('ready', 'active') then 'draft' else public.daily_plans.status end,
        ready_at = case when public.daily_plans.status in ('ready', 'active') then null else public.daily_plans.ready_at end
  returning id into target_plan_id;

  if chosen_selected then
    if not exists (
      select 1 from public.work_items where id = target_work_item_id
        and workspace_id = personal_workspace_id and tracking_state <> 'archived'
    ) then raise exception 'Work item not found.'; end if;
    select coalesce(max(position), -1) + 1 into next_position
    from public.daily_plan_items where daily_plan_id = target_plan_id;
    insert into public.daily_plan_items (workspace_id, daily_plan_id, work_item_id, position)
    values (personal_workspace_id, target_plan_id, target_work_item_id, next_position)
    on conflict (daily_plan_id, work_item_id) do nothing;
  else
    delete from public.daily_plan_items where daily_plan_id = target_plan_id
      and work_item_id = target_work_item_id and execution_status = 'planned';
    with reordered as (
      select id, row_number() over (order by position, id) - 1 as new_position
      from public.daily_plan_items where daily_plan_id = target_plan_id
    )
    update public.daily_plan_items set position = reordered.new_position + 100000
    from reordered where public.daily_plan_items.id = reordered.id;
    update public.daily_plan_items set position = position - 100000
    where daily_plan_id = target_plan_id;
  end if;
  return target_plan_id;
end;
$$;

create or replace function public.move_daily_plan_item(target_daily_plan_item_id uuid, chosen_direction integer)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  target_plan_id uuid;
  target_position integer;
  adjacent_item_id uuid;
  adjacent_position integer;
begin
  if chosen_direction not in (-1, 1) then raise exception 'Direction must be -1 or 1.'; end if;
  personal_workspace_id := public.current_personal_workspace_id();
  select daily_plan_id, position into target_plan_id, target_position
  from public.daily_plan_items where id = target_daily_plan_item_id and workspace_id = personal_workspace_id;
  if target_plan_id is null then raise exception 'Plan item not found.'; end if;
  select id, position into adjacent_item_id, adjacent_position
  from public.daily_plan_items where daily_plan_id = target_plan_id
    and position = target_position + chosen_direction;
  if adjacent_item_id is null then return; end if;
  update public.daily_plan_items set position = case
    when id = target_daily_plan_item_id then adjacent_position + 100000
    else target_position + 100000 end
  where id in (target_daily_plan_item_id, adjacent_item_id);
  update public.daily_plan_items set position = position - 100000
  where id in (target_daily_plan_item_id, adjacent_item_id);
  update public.daily_plans set status = 'draft', ready_at = null
  where id = target_plan_id and status in ('ready', 'active');
end;
$$;

create or replace function public.update_daily_plan_details(
  chosen_work_date date,
  chosen_intention text,
  chosen_mark_ready boolean
)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  target_plan_id uuid;
  item_count integer;
begin
  personal_workspace_id := public.current_personal_workspace_id();
  insert into public.daily_plans (workspace_id, work_date, intention)
  values (personal_workspace_id, chosen_work_date, nullif(trim(chosen_intention), ''))
  on conflict (workspace_id, work_date) do update set intention = nullif(trim(chosen_intention), '')
  returning id into target_plan_id;
  if chosen_mark_ready then
    select count(*) into item_count from public.daily_plan_items where daily_plan_id = target_plan_id;
    if item_count = 0 then raise exception 'Choose at least one work item before marking this plan ready.'; end if;
    update public.daily_plans set status = 'ready', ready_at = now() where id = target_plan_id;
  end if;
  return target_plan_id;
end;
$$;

create or replace function public.set_daily_plan_item_done(target_daily_plan_item_id uuid, chosen_done boolean)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  target_item public.daily_plan_items%rowtype;
  target_work_date date;
begin
  personal_workspace_id := public.current_personal_workspace_id();
  select * into target_item from public.daily_plan_items
  where id = target_daily_plan_item_id and workspace_id = personal_workspace_id;
  if target_item.id is null then raise exception 'Plan item not found.'; end if;
  select work_date into target_work_date from public.daily_plans where id = target_item.daily_plan_id;
  update public.daily_plan_items
  set execution_status = case
        when chosen_done then 'done'::public.plan_execution_status
        else 'planned'::public.plan_execution_status
      end,
      started_at = case when chosen_done then coalesce(started_at, now()) else started_at end,
      completed_at = case when chosen_done then now() else null end
  where id = target_item.id;
  if chosen_done then
    insert into public.work_logs (workspace_id, work_item_id, daily_plan_item_id, worked_on, started_at, ended_at, outcome)
    values (personal_workspace_id, target_item.work_item_id, target_item.id, target_work_date, coalesce(target_item.started_at, now()), now(), 'done')
    on conflict (daily_plan_item_id) do update set ended_at = excluded.ended_at, outcome = excluded.outcome;
    update public.daily_plans set status = case when status = 'ready' then 'active' else status end
    where id = target_item.daily_plan_id;
  end if;
end;
$$;

alter table public.daily_plans enable row level security;
alter table public.daily_plan_items enable row level security;
alter table public.work_logs enable row level security;
alter table public.day_notes enable row level security;
alter table public.non_working_days enable row level security;

create policy "daily_plans_member_all" on public.daily_plans for all to authenticated
  using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "daily_plan_items_member_all" on public.daily_plan_items for all to authenticated
  using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "work_logs_member_all" on public.work_logs for all to authenticated
  using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "day_notes_member_all" on public.day_notes for all to authenticated
  using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "non_working_days_member_select" on public.non_working_days for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy "non_working_days_owner_all" on public.non_working_days for all to authenticated
  using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));

grant select, insert, update, delete on public.daily_plans to authenticated;
grant select, insert, update, delete on public.daily_plan_items to authenticated;
grant select, insert, update on public.work_logs to authenticated;
grant select, insert, update on public.day_notes to authenticated;
grant select, insert, update, delete on public.non_working_days to authenticated;

revoke all on function public.next_workday(date) from public;
revoke all on function public.set_plan_item_selected(date, uuid, boolean) from public;
revoke all on function public.move_daily_plan_item(uuid, integer) from public;
revoke all on function public.update_daily_plan_details(date, text, boolean) from public;
revoke all on function public.set_daily_plan_item_done(uuid, boolean) from public;
grant execute on function public.next_workday(date) to authenticated;
grant execute on function public.set_plan_item_selected(date, uuid, boolean) to authenticated;
grant execute on function public.move_daily_plan_item(uuid, integer) to authenticated;
grant execute on function public.update_daily_plan_details(date, text, boolean) to authenticated;
grant execute on function public.set_daily_plan_item_done(uuid, boolean) to authenticated;
