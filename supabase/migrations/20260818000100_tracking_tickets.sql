alter table public.ticket_details
  add column if not exists is_tracking_ticket boolean not null default false;

alter table public.ticket_details
  alter column ticket_number drop not null;

alter table public.ticket_details
  drop constraint if exists ticket_details_ticket_number_check;

create or replace function public.normalize_tracking_ticket_details()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_tracking_ticket or nullif(trim(coalesce(new.ticket_number, '')), '') is null then
    new.is_tracking_ticket := true;
    new.ticket_number := null;
  else
    new.ticket_number := trim(new.ticket_number);
  end if;

  return new;
end;
$$;

drop trigger if exists ticket_details_normalize_tracking_ticket on public.ticket_details;
create trigger ticket_details_normalize_tracking_ticket
  before insert or update of ticket_number, is_tracking_ticket
  on public.ticket_details
  for each row
  execute function public.normalize_tracking_ticket_details();

alter table public.ticket_details
  add constraint ticket_details_ticket_number_check
  check (
    is_tracking_ticket
    or (
      ticket_number is not null
      and char_length(trim(ticket_number)) between 1 and 80
    )
  );

drop function if exists public.create_ticket(
  text,
  text,
  uuid,
  date,
  public.ticket_priority,
  public.ticket_operational_status,
  text,
  boolean,
  text,
  text
);

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
  chosen_note text default null,
  chosen_is_tracking_ticket boolean default false
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
    is_tracking_ticket,
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
    case when chosen_is_tracking_ticket then null else chosen_ticket_number end,
    chosen_is_tracking_ticket,
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

drop function if exists public.update_ticket(
  uuid,
  text,
  text,
  uuid,
  date,
  public.ticket_priority,
  public.ticket_operational_status,
  public.work_tracking_state,
  text,
  boolean,
  text
);

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
  chosen_external_url text default null,
  chosen_is_tracking_ticket boolean default false
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
  set ticket_number = case when chosen_is_tracking_ticket then null else chosen_ticket_number end,
      is_tracking_ticket = chosen_is_tracking_ticket,
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
  case
    when ticket_details.is_tracking_ticket then 'Tracking Ticket'
    else ticket_details.ticket_number
  end as ticket_number,
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
  ) as next_review_on,
  (
    select max(work_logs.worked_on)
    from public.work_logs
    where work_logs.work_item_id = work_items.id
  ) as last_worked_on,
  ticket_details.is_tracking_ticket
from public.work_items
left join public.ticket_details on ticket_details.work_item_id = work_items.id
left join public.ticket_types on ticket_types.id = ticket_details.ticket_type_id
left join public.task_details on task_details.work_item_id = work_items.id
left join public.reminder_details on reminder_details.work_item_id = work_items.id;

create or replace function public.global_work_search(
  chosen_query text,
  chosen_include_archived boolean default false
)
returns table (
  id uuid,
  kind public.work_item_kind,
  title text,
  ticket_number text,
  ticket_type_name text,
  operational_status public.ticket_operational_status,
  tracking_state public.work_tracking_state,
  updated_at timestamptz,
  match_reason text
)
language sql stable security invoker set search_path = ''
as $$
  with candidates as (
    select
      work_items.id,
      work_items.kind,
      work_items.title,
      case
        when ticket_details.is_tracking_ticket then 'Tracking Ticket'
        else ticket_details.ticket_number
      end as ticket_number,
      ticket_types.name as ticket_type_name,
      ticket_details.operational_status,
      work_items.tracking_state,
      work_items.updated_at,
      case
        when ticket_details.normalized_ticket_number = upper(trim(chosen_query)) then 'Ticket number'
        when ticket_details.is_tracking_ticket and lower(trim(chosen_query)) = 'tracking ticket' then 'Ticket number'
        when lower(work_items.title) like '%' || lower(trim(chosen_query)) || '%' then 'Title'
        when lower(coalesce(ticket_types.name, '')) like '%' || lower(trim(chosen_query)) || '%' then 'Type'
        when exists (
          select 1 from public.work_item_notes
          where work_item_notes.work_item_id = work_items.id
            and lower(work_item_notes.body) like '%' || lower(trim(chosen_query)) || '%'
        ) then 'Notes'
        else 'External link'
      end as match_reason,
      case
        when ticket_details.normalized_ticket_number = upper(trim(chosen_query)) then 0
        when ticket_details.is_tracking_ticket and lower(trim(chosen_query)) = 'tracking ticket' then 0
        when work_items.tracking_state in ('active', 'watching') then 1
        else 2
      end as match_rank
    from public.work_items
    left join public.ticket_details on ticket_details.work_item_id = work_items.id
    left join public.ticket_types on ticket_types.id = ticket_details.ticket_type_id
    where work_items.workspace_id = public.current_personal_workspace_id()
      and (chosen_include_archived or work_items.tracking_state <> 'archived')
      and length(trim(chosen_query)) between 2 and 120
      and (
        ticket_details.normalized_ticket_number = upper(trim(chosen_query))
        or (ticket_details.is_tracking_ticket and lower(trim(chosen_query)) = 'tracking ticket')
        or lower(work_items.title) like '%' || lower(trim(chosen_query)) || '%'
        or lower(coalesce(ticket_types.name, '')) like '%' || lower(trim(chosen_query)) || '%'
        or lower(coalesce(ticket_details.external_url, '')) like '%' || lower(trim(chosen_query)) || '%'
        or exists (
          select 1 from public.work_item_notes
          where work_item_notes.work_item_id = work_items.id
            and lower(work_item_notes.body) like '%' || lower(trim(chosen_query)) || '%'
        )
      )
  )
  select
    candidates.id,
    candidates.kind,
    candidates.title,
    candidates.ticket_number,
    candidates.ticket_type_name,
    candidates.operational_status,
    candidates.tracking_state,
    candidates.updated_at,
    candidates.match_reason
  from candidates
  order by candidates.match_rank, candidates.updated_at desc
  limit 8;
$$;

revoke all on function public.create_ticket(
  text,
  text,
  uuid,
  date,
  public.ticket_priority,
  public.ticket_operational_status,
  text,
  boolean,
  text,
  text,
  boolean
) from public;
grant execute on function public.create_ticket(
  text,
  text,
  uuid,
  date,
  public.ticket_priority,
  public.ticket_operational_status,
  text,
  boolean,
  text,
  text,
  boolean
) to authenticated;

revoke all on function public.update_ticket(
  uuid,
  text,
  text,
  uuid,
  date,
  public.ticket_priority,
  public.ticket_operational_status,
  public.work_tracking_state,
  text,
  boolean,
  text,
  boolean
) from public;
grant execute on function public.update_ticket(
  uuid,
  text,
  text,
  uuid,
  date,
  public.ticket_priority,
  public.ticket_operational_status,
  public.work_tracking_state,
  text,
  boolean,
  text,
  boolean
) to authenticated;
