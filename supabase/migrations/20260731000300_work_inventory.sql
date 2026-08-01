create type public.work_item_kind as enum ('ticket', 'task', 'reminder');
create type public.work_tracking_state as enum ('active', 'watching', 'closed', 'archived');
create type public.ticket_priority as enum ('urgent', 'high', 'medium', 'low');
create type public.ticket_operational_status as enum (
  'pending',
  'in_progress',
  'waiting_response',
  'resolved'
);
create type public.follow_up_state as enum ('open', 'completed', 'cancelled');
create type public.status_dimension as enum ('operational', 'tracking', 'backup');

create table public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  unique (workspace_id, name)
);

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind public.work_item_kind not null,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text check (description is null or char_length(description) <= 10000),
  tracking_state public.work_tracking_state not null default 'active',
  due_at timestamptz,
  archived_at timestamptz,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  unique (id, workspace_id, kind),
  constraint work_item_archive_consistency check (
    (tracking_state = 'archived' and archived_at is not null)
    or (tracking_state <> 'archived' and archived_at is null)
  )
);

create table public.ticket_details (
  work_item_id uuid primary key,
  workspace_id uuid not null,
  kind public.work_item_kind not null default 'ticket' check (kind = 'ticket'),
  ticket_number text not null check (char_length(trim(ticket_number)) between 1 and 80),
  normalized_ticket_number text generated always as (upper(trim(ticket_number))) stored,
  ticket_type_id uuid not null,
  system_priority public.ticket_priority not null default 'medium',
  operational_status public.ticket_operational_status not null default 'pending',
  received_at date not null default current_date,
  resolved_at timestamptz,
  closed_at timestamptz,
  form_backup_completed_at timestamptz,
  external_url text check (external_url is null or external_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (work_item_id, workspace_id, kind)
    references public.work_items (id, workspace_id, kind) on delete cascade,
  foreign key (ticket_type_id, workspace_id)
    references public.ticket_types (id, workspace_id),
  unique (workspace_id, normalized_ticket_number)
);

create table public.task_details (
  work_item_id uuid primary key,
  workspace_id uuid not null,
  kind public.work_item_kind not null default 'task' check (kind = 'task'),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (work_item_id, workspace_id, kind)
    references public.work_items (id, workspace_id, kind) on delete cascade
);

create table public.reminder_details (
  work_item_id uuid primary key,
  workspace_id uuid not null,
  kind public.work_item_kind not null default 'reminder' check (kind = 'reminder'),
  remind_at timestamptz not null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (work_item_id, workspace_id, kind)
    references public.work_items (id, workspace_id, kind) on delete cascade
);

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  work_item_id uuid not null,
  state public.follow_up_state not null default 'open',
  reason text not null check (char_length(trim(reason)) between 1 and 500),
  waiting_on text check (waiting_on is null or char_length(waiting_on) <= 200),
  started_at timestamptz not null default now(),
  review_on date,
  completed_at timestamptz,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (work_item_id, workspace_id)
    references public.work_items (id, workspace_id) on delete cascade,
  constraint follow_up_completion_consistency check (
    (state = 'open' and completed_at is null)
    or (state <> 'open' and completed_at is not null)
  )
);

create table public.work_item_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  work_item_id uuid not null,
  body text not null check (char_length(trim(body)) between 1 and 10000),
  is_pinned boolean not null default false,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (work_item_id, workspace_id)
    references public.work_items (id, workspace_id) on delete cascade
);

create table public.status_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  work_item_id uuid not null,
  status_dimension public.status_dimension not null,
  from_value text,
  to_value text not null,
  changed_by uuid references auth.users (id),
  changed_at timestamptz not null default now(),
  foreign key (work_item_id, workspace_id)
    references public.work_items (id, workspace_id) on delete cascade
);

create index work_items_workspace_tracking_idx
  on public.work_items (workspace_id, tracking_state, updated_at desc);
create index work_items_workspace_kind_idx
  on public.work_items (workspace_id, kind, updated_at desc);
create index ticket_details_workspace_status_idx
  on public.ticket_details (workspace_id, operational_status, system_priority, received_at);
create index follow_ups_workspace_review_idx
  on public.follow_ups (workspace_id, state, review_on);
create index work_item_notes_item_created_idx
  on public.work_item_notes (work_item_id, created_at desc);
create index status_events_item_changed_idx
  on public.status_events (work_item_id, changed_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger ticket_types_set_updated_at before update on public.ticket_types
  for each row execute procedure public.set_updated_at();
create trigger work_items_set_updated_at before update on public.work_items
  for each row execute procedure public.set_updated_at();
create trigger ticket_details_set_updated_at before update on public.ticket_details
  for each row execute procedure public.set_updated_at();
create trigger task_details_set_updated_at before update on public.task_details
  for each row execute procedure public.set_updated_at();
create trigger reminder_details_set_updated_at before update on public.reminder_details
  for each row execute procedure public.set_updated_at();
create trigger follow_ups_set_updated_at before update on public.follow_ups
  for each row execute procedure public.set_updated_at();
create trigger work_item_notes_set_updated_at before update on public.work_item_notes
  for each row execute procedure public.set_updated_at();

create or replace function public.record_tracking_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or old.tracking_state is distinct from new.tracking_state then
    insert into public.status_events (
      workspace_id,
      work_item_id,
      status_dimension,
      from_value,
      to_value,
      changed_by
    )
    values (
      new.workspace_id,
      new.id,
      'tracking',
      case when tg_op = 'INSERT' then null else old.tracking_state::text end,
      new.tracking_state::text,
      (select auth.uid())
    );
  end if;

  return new;
end;
$$;

create trigger work_items_record_tracking
  after insert or update of tracking_state on public.work_items
  for each row execute procedure public.record_tracking_event();

create or replace function public.record_ticket_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or old.operational_status is distinct from new.operational_status then
    insert into public.status_events (
      workspace_id,
      work_item_id,
      status_dimension,
      from_value,
      to_value,
      changed_by
    )
    values (
      new.workspace_id,
      new.work_item_id,
      'operational',
      case when tg_op = 'INSERT' then null else old.operational_status::text end,
      new.operational_status::text,
      (select auth.uid())
    );
  end if;

  if tg_op = 'UPDATE'
    and old.form_backup_completed_at is distinct from new.form_backup_completed_at then
    insert into public.status_events (
      workspace_id,
      work_item_id,
      status_dimension,
      from_value,
      to_value,
      changed_by
    )
    values (
      new.workspace_id,
      new.work_item_id,
      'backup',
      case when old.form_backup_completed_at is null then 'incomplete' else 'complete' end,
      case when new.form_backup_completed_at is null then 'incomplete' else 'complete' end,
      (select auth.uid())
    );
  elsif tg_op = 'INSERT' and new.form_backup_completed_at is not null then
    insert into public.status_events (
      workspace_id,
      work_item_id,
      status_dimension,
      from_value,
      to_value,
      changed_by
    )
    values (
      new.workspace_id,
      new.work_item_id,
      'backup',
      null,
      'complete',
      (select auth.uid())
    );
  end if;

  return new;
end;
$$;

create trigger ticket_details_record_events
  after insert or update of operational_status, form_backup_completed_at
  on public.ticket_details
  for each row execute procedure public.record_ticket_events();

create or replace function public.current_personal_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select workspace_id
  from public.workspace_members
  where profile_id = (select auth.uid())
  order by (role = 'owner') desc, created_at
  limit 1;
$$;

create or replace function public.create_ticket(
  chosen_ticket_number text,
  chosen_title text,
  chosen_ticket_type_id uuid,
  chosen_received_at date,
  chosen_system_priority public.ticket_priority default 'medium',
  chosen_operational_status public.ticket_operational_status default 'pending',
  chosen_description text default null,
  chosen_form_backup_complete boolean default false,
  chosen_external_url text default null,
  chosen_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  new_work_item_id uuid;
begin
  personal_workspace_id := public.current_personal_workspace_id();

  if personal_workspace_id is null then
    raise exception 'A personal workspace was not found.';
  end if;

  if not exists (
    select 1 from public.ticket_types
    where id = chosen_ticket_type_id
      and workspace_id = personal_workspace_id
      and is_active
  ) then
    raise exception 'Choose an active ticket type.';
  end if;

  insert into public.work_items (
    workspace_id,
    kind,
    title,
    description,
    created_by
  )
  values (
    personal_workspace_id,
    'ticket',
    trim(chosen_title),
    nullif(trim(chosen_description), ''),
    (select auth.uid())
  )
  returning id into new_work_item_id;

  insert into public.ticket_details (
    work_item_id,
    workspace_id,
    ticket_number,
    ticket_type_id,
    system_priority,
    operational_status,
    received_at,
    form_backup_completed_at,
    external_url
  )
  values (
    new_work_item_id,
    personal_workspace_id,
    trim(chosen_ticket_number),
    chosen_ticket_type_id,
    chosen_system_priority,
    chosen_operational_status,
    chosen_received_at,
    case when chosen_form_backup_complete then now() else null end,
    nullif(trim(chosen_external_url), '')
  );

  if nullif(trim(chosen_note), '') is not null then
    insert into public.work_item_notes (
      workspace_id,
      work_item_id,
      body,
      created_by
    )
    values (
      personal_workspace_id,
      new_work_item_id,
      trim(chosen_note),
      (select auth.uid())
    );
  end if;

  return new_work_item_id;
end;
$$;

create or replace function public.create_task(
  chosen_title text,
  chosen_description text default null,
  chosen_due_at timestamptz default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  new_work_item_id uuid;
begin
  personal_workspace_id := public.current_personal_workspace_id();

  insert into public.work_items (
    workspace_id,
    kind,
    title,
    description,
    due_at,
    created_by
  )
  values (
    personal_workspace_id,
    'task',
    trim(chosen_title),
    nullif(trim(chosen_description), ''),
    chosen_due_at,
    (select auth.uid())
  )
  returning id into new_work_item_id;

  insert into public.task_details (work_item_id, workspace_id)
  values (new_work_item_id, personal_workspace_id);

  return new_work_item_id;
end;
$$;

create or replace function public.create_reminder(
  chosen_title text,
  chosen_remind_at timestamptz,
  chosen_description text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  new_work_item_id uuid;
begin
  personal_workspace_id := public.current_personal_workspace_id();

  insert into public.work_items (
    workspace_id,
    kind,
    title,
    description,
    due_at,
    created_by
  )
  values (
    personal_workspace_id,
    'reminder',
    trim(chosen_title),
    nullif(trim(chosen_description), ''),
    chosen_remind_at,
    (select auth.uid())
  )
  returning id into new_work_item_id;

  insert into public.reminder_details (
    work_item_id,
    workspace_id,
    remind_at
  )
  values (new_work_item_id, personal_workspace_id, chosen_remind_at);

  return new_work_item_id;
end;
$$;

create or replace function public.update_ticket(
  target_work_item_id uuid,
  chosen_ticket_number text,
  chosen_title text,
  chosen_ticket_type_id uuid,
  chosen_received_at date,
  chosen_system_priority public.ticket_priority,
  chosen_operational_status public.ticket_operational_status,
  chosen_tracking_state public.work_tracking_state,
  chosen_description text default null,
  chosen_form_backup_complete boolean default false,
  chosen_external_url text default null
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

  update public.work_items
  set title = trim(chosen_title),
      description = nullif(trim(chosen_description), ''),
      tracking_state = chosen_tracking_state,
      archived_at = case when chosen_tracking_state = 'archived' then coalesce(archived_at, now()) else null end
  where id = target_work_item_id
    and workspace_id = personal_workspace_id
    and kind = 'ticket';

  if not found then
    raise exception 'Ticket not found.';
  end if;

  update public.ticket_details
  set ticket_number = trim(chosen_ticket_number),
      ticket_type_id = chosen_ticket_type_id,
      received_at = chosen_received_at,
      system_priority = chosen_system_priority,
      operational_status = chosen_operational_status,
      resolved_at = case
        when chosen_operational_status = 'resolved' then coalesce(resolved_at, now())
        else resolved_at
      end,
      closed_at = case
        when chosen_tracking_state = 'closed' then coalesce(closed_at, now())
        else null
      end,
      form_backup_completed_at = case
        when chosen_form_backup_complete then coalesce(form_backup_completed_at, now())
        else null
      end,
      external_url = nullif(trim(chosen_external_url), '')
  where work_item_id = target_work_item_id
    and workspace_id = personal_workspace_id;
end;
$$;

create or replace function public.update_task(
  target_work_item_id uuid,
  chosen_title text,
  chosen_tracking_state public.work_tracking_state,
  chosen_description text default null,
  chosen_due_at timestamptz default null
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

  update public.work_items
  set title = trim(chosen_title),
      description = nullif(trim(chosen_description), ''),
      due_at = chosen_due_at,
      tracking_state = chosen_tracking_state,
      archived_at = case when chosen_tracking_state = 'archived' then coalesce(archived_at, now()) else null end
  where id = target_work_item_id
    and workspace_id = personal_workspace_id
    and kind = 'task';

  if not found then
    raise exception 'Task not found.';
  end if;

  update public.task_details
  set completed_at = case when chosen_tracking_state = 'closed' then coalesce(completed_at, now()) else null end
  where work_item_id = target_work_item_id
    and workspace_id = personal_workspace_id;
end;
$$;

create or replace function public.update_reminder(
  target_work_item_id uuid,
  chosen_title text,
  chosen_remind_at timestamptz,
  chosen_tracking_state public.work_tracking_state,
  chosen_description text default null
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

  update public.work_items
  set title = trim(chosen_title),
      description = nullif(trim(chosen_description), ''),
      due_at = chosen_remind_at,
      tracking_state = chosen_tracking_state,
      archived_at = case when chosen_tracking_state = 'archived' then coalesce(archived_at, now()) else null end
  where id = target_work_item_id
    and workspace_id = personal_workspace_id
    and kind = 'reminder';

  if not found then
    raise exception 'Reminder not found.';
  end if;

  update public.reminder_details
  set remind_at = chosen_remind_at,
      acknowledged_at = case when chosen_tracking_state = 'closed' then coalesce(acknowledged_at, now()) else null end
  where work_item_id = target_work_item_id
    and workspace_id = personal_workspace_id;
end;
$$;

create or replace function public.add_work_item_note(
  target_work_item_id uuid,
  chosen_body text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  new_note_id uuid;
begin
  personal_workspace_id := public.current_personal_workspace_id();

  insert into public.work_item_notes (
    workspace_id,
    work_item_id,
    body,
    created_by
  )
  select
    personal_workspace_id,
    id,
    trim(chosen_body),
    (select auth.uid())
  from public.work_items
  where id = target_work_item_id
    and workspace_id = personal_workspace_id
  returning id into new_note_id;

  if new_note_id is null then
    raise exception 'Work item not found.';
  end if;

  return new_note_id;
end;
$$;

create or replace function public.save_open_follow_up(
  target_work_item_id uuid,
  chosen_reason text,
  chosen_waiting_on text default null,
  chosen_review_on date default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  existing_follow_up_id uuid;
begin
  personal_workspace_id := public.current_personal_workspace_id();

  select id into existing_follow_up_id
  from public.follow_ups
  where workspace_id = personal_workspace_id
    and work_item_id = target_work_item_id
    and state = 'open'
  order by created_at desc
  limit 1;

  if existing_follow_up_id is null then
    insert into public.follow_ups (
      workspace_id,
      work_item_id,
      reason,
      waiting_on,
      review_on,
      created_by
    )
    values (
      personal_workspace_id,
      target_work_item_id,
      trim(chosen_reason),
      nullif(trim(chosen_waiting_on), ''),
      chosen_review_on,
      (select auth.uid())
    )
    returning id into existing_follow_up_id;
  else
    update public.follow_ups
    set reason = trim(chosen_reason),
        waiting_on = nullif(trim(chosen_waiting_on), ''),
        review_on = chosen_review_on
    where id = existing_follow_up_id;
  end if;

  return existing_follow_up_id;
end;
$$;

create or replace view public.work_inventory_rows
with (security_invoker = true)
as
select
  work_items.id,
  work_items.workspace_id,
  work_items.kind,
  work_items.title,
  work_items.description,
  work_items.tracking_state,
  work_items.due_at,
  work_items.archived_at,
  work_items.created_at,
  work_items.updated_at,
  ticket_details.ticket_number,
  ticket_details.ticket_type_id,
  ticket_types.name as ticket_type_name,
  ticket_details.system_priority,
  ticket_details.operational_status,
  ticket_details.received_at,
  ticket_details.resolved_at,
  ticket_details.closed_at,
  ticket_details.form_backup_completed_at,
  ticket_details.external_url,
  reminder_details.remind_at,
  task_details.completed_at as task_completed_at,
  reminder_details.acknowledged_at as reminder_acknowledged_at,
  (
    select min(follow_ups.review_on)
    from public.follow_ups
    where follow_ups.work_item_id = work_items.id
      and follow_ups.state = 'open'
  ) as next_review_on
from public.work_items
left join public.ticket_details on ticket_details.work_item_id = work_items.id
left join public.ticket_types on ticket_types.id = ticket_details.ticket_type_id
left join public.task_details on task_details.work_item_id = work_items.id
left join public.reminder_details on reminder_details.work_item_id = work_items.id;

alter table public.ticket_types enable row level security;
alter table public.work_items enable row level security;
alter table public.ticket_details enable row level security;
alter table public.task_details enable row level security;
alter table public.reminder_details enable row level security;
alter table public.follow_ups enable row level security;
alter table public.work_item_notes enable row level security;
alter table public.status_events enable row level security;

create policy "ticket_types_select_member" on public.ticket_types for select
  to authenticated using (public.is_workspace_member(workspace_id));
create policy "ticket_types_insert_owner" on public.ticket_types for insert
  to authenticated with check (public.is_workspace_owner(workspace_id));
create policy "ticket_types_update_owner" on public.ticket_types for update
  to authenticated using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

create policy "work_items_select_member" on public.work_items for select
  to authenticated using (public.is_workspace_member(workspace_id));
create policy "work_items_insert_member" on public.work_items for insert
  to authenticated with check (
    public.is_workspace_member(workspace_id)
    and created_by = (select auth.uid())
  );
create policy "work_items_update_member" on public.work_items for update
  to authenticated using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "ticket_details_select_member" on public.ticket_details for select
  to authenticated using (public.is_workspace_member(workspace_id));
create policy "ticket_details_insert_member" on public.ticket_details for insert
  to authenticated with check (public.is_workspace_member(workspace_id));
create policy "ticket_details_update_member" on public.ticket_details for update
  to authenticated using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "task_details_select_member" on public.task_details for select
  to authenticated using (public.is_workspace_member(workspace_id));
create policy "task_details_insert_member" on public.task_details for insert
  to authenticated with check (public.is_workspace_member(workspace_id));
create policy "task_details_update_member" on public.task_details for update
  to authenticated using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "reminder_details_select_member" on public.reminder_details for select
  to authenticated using (public.is_workspace_member(workspace_id));
create policy "reminder_details_insert_member" on public.reminder_details for insert
  to authenticated with check (public.is_workspace_member(workspace_id));
create policy "reminder_details_update_member" on public.reminder_details for update
  to authenticated using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "follow_ups_select_member" on public.follow_ups for select
  to authenticated using (public.is_workspace_member(workspace_id));
create policy "follow_ups_insert_member" on public.follow_ups for insert
  to authenticated with check (
    public.is_workspace_member(workspace_id)
    and created_by = (select auth.uid())
  );
create policy "follow_ups_update_member" on public.follow_ups for update
  to authenticated using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "work_item_notes_select_member" on public.work_item_notes for select
  to authenticated using (public.is_workspace_member(workspace_id));
create policy "work_item_notes_insert_member" on public.work_item_notes for insert
  to authenticated with check (
    public.is_workspace_member(workspace_id)
    and created_by = (select auth.uid())
  );
create policy "work_item_notes_update_author" on public.work_item_notes for update
  to authenticated using (
    public.is_workspace_member(workspace_id)
    and created_by = (select auth.uid())
  )
  with check (
    public.is_workspace_member(workspace_id)
    and created_by = (select auth.uid())
  );

create policy "status_events_select_member" on public.status_events for select
  to authenticated using (public.is_workspace_member(workspace_id));

revoke all on function public.current_personal_workspace_id() from public;
revoke all on function public.create_ticket(text, text, uuid, date, public.ticket_priority, public.ticket_operational_status, text, boolean, text, text) from public;
revoke all on function public.create_task(text, text, timestamptz) from public;
revoke all on function public.create_reminder(text, timestamptz, text) from public;
revoke all on function public.update_ticket(uuid, text, text, uuid, date, public.ticket_priority, public.ticket_operational_status, public.work_tracking_state, text, boolean, text) from public;
revoke all on function public.update_task(uuid, text, public.work_tracking_state, text, timestamptz) from public;
revoke all on function public.update_reminder(uuid, text, timestamptz, public.work_tracking_state, text) from public;
revoke all on function public.add_work_item_note(uuid, text) from public;
revoke all on function public.save_open_follow_up(uuid, text, text, date) from public;

grant execute on function public.current_personal_workspace_id() to authenticated;
grant execute on function public.create_ticket(text, text, uuid, date, public.ticket_priority, public.ticket_operational_status, text, boolean, text, text) to authenticated;
grant execute on function public.create_task(text, text, timestamptz) to authenticated;
grant execute on function public.create_reminder(text, timestamptz, text) to authenticated;
grant execute on function public.update_ticket(uuid, text, text, uuid, date, public.ticket_priority, public.ticket_operational_status, public.work_tracking_state, text, boolean, text) to authenticated;
grant execute on function public.update_task(uuid, text, public.work_tracking_state, text, timestamptz) to authenticated;
grant execute on function public.update_reminder(uuid, text, timestamptz, public.work_tracking_state, text) to authenticated;
grant execute on function public.add_work_item_note(uuid, text) to authenticated;
grant execute on function public.save_open_follow_up(uuid, text, text, date) to authenticated;

grant select, insert, update on public.ticket_types to authenticated;
grant select, insert, update on public.work_items to authenticated;
grant select, insert, update on public.ticket_details to authenticated;
grant select, insert, update on public.task_details to authenticated;
grant select, insert, update on public.reminder_details to authenticated;
grant select, insert, update on public.follow_ups to authenticated;
grant select, insert, update on public.work_item_notes to authenticated;
grant select on public.status_events to authenticated;
grant select on public.work_inventory_rows to authenticated;

insert into public.ticket_types (workspace_id, name, sort_order)
select workspaces.id, defaults.name, defaults.sort_order
from public.workspaces
cross join (
  values ('Change', 10), ('Form', 20), ('Content', 30), ('Other', 40)
) as defaults(name, sort_order)
on conflict (workspace_id, name) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  personal_workspace_id uuid;
  chosen_display_name text;
begin
  chosen_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    split_part(coalesce(new.email, 'North Haven user'), '@', 1)
  );

  insert into public.profiles (id, display_name)
  values (new.id, chosen_display_name);

  insert into public.workspaces (name)
  values ('North Haven')
  returning id into personal_workspace_id;

  insert into public.workspace_members (workspace_id, profile_id, role)
  values (personal_workspace_id, new.id, 'owner');

  insert into public.work_schedules (workspace_id)
  values (personal_workspace_id);

  insert into public.ticket_types (workspace_id, name, sort_order)
  values
    (personal_workspace_id, 'Change', 10),
    (personal_workspace_id, 'Form', 20),
    (personal_workspace_id, 'Content', 30),
    (personal_workspace_id, 'Other', 40);

  return new;
end;
$$;
