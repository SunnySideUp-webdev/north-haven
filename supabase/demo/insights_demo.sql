-- Local-only synthetic data for visual review of Calendar and Insights.
-- Every record is identifiable by DEMO-INSIGHT or [DEMO] and can be removed
-- with supabase/demo/remove_insights_demo.sql.

begin;

do $$
declare
  target_workspace_id uuid;
  target_user_id uuid;
  target_ticket_type_id uuid;
  demo_ticket_ids uuid[] := array[]::uuid[];
  demo_ticket_id uuid;
  demo_plan_id uuid;
  demo_plan_item_id uuid;
  demo_date date;
  received_date date;
  resolved_date date;
  closed_date date;
  demo_tracking public.work_tracking_state;
  demo_operational public.ticket_operational_status;
  demo_execution public.plan_execution_status;
  demo_outcome public.work_log_outcome;
  ticket_index integer;
  date_index integer := 0;
  item_position integer;
begin
  select connection.workspace_id, member.profile_id
  into target_workspace_id, target_user_id
  from public.calendar_connections connection
  join public.workspace_members member
    on member.workspace_id = connection.workspace_id
    and member.role = 'owner'
  where connection.status = 'connected'
  order by connection.updated_at desc
  limit 1;

  if target_workspace_id is null or target_user_id is null then
    raise exception 'A connected local workspace is required for the Insights demo.';
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

  select type.id into target_ticket_type_id
  from public.ticket_types type
  where type.workspace_id = target_workspace_id and type.is_active
  order by type.sort_order, type.name
  limit 1;

  if target_ticket_type_id is null then
    raise exception 'An active ticket type is required for the Insights demo.';
  end if;

  for ticket_index in 1..16 loop
    received_date := case ticket_index
      when 1 then date '2026-06-02'
      when 2 then date '2026-06-10'
      when 3 then date '2026-06-18'
      when 4 then date '2026-06-25'
      when 5 then date '2026-07-01'
      when 6 then date '2026-07-03'
      when 7 then date '2026-06-05'
      when 8 then date '2026-06-15'
      when 9 then date '2026-07-07'
      when 10 then date '2026-06-08'
      when 11 then date '2026-06-22'
      when 12 then date '2026-07-10'
      when 13 then date '2026-06-01'
      when 14 then date '2026-06-12'
      when 15 then date '2026-07-02'
      else date '2026-07-14'
    end;

    demo_tracking := case
      when ticket_index between 7 and 12 then 'watching'
      when ticket_index between 13 and 16 then 'closed'
      else 'active'
    end;
    demo_operational := case
      when ticket_index between 7 and 9 then 'resolved'
      when ticket_index between 10 and 12 then 'waiting_response'
      when ticket_index between 13 and 16 then 'resolved'
      when mod(ticket_index, 2) = 0 then 'in_progress'
      else 'pending'
    end;

    insert into public.work_items (
      workspace_id,
      kind,
      title,
      description,
      tracking_state,
      created_by,
      created_at
    ) values (
      target_workspace_id,
      'ticket',
      format('[DEMO] Insights sample %s', lpad(ticket_index::text, 2, '0')),
      'Synthetic record for visual review. Safe to delete.',
      demo_tracking,
      target_user_id,
      received_date::timestamp + time '14:00'
    ) returning id into demo_ticket_id;

    demo_ticket_ids := array_append(demo_ticket_ids, demo_ticket_id);
    resolved_date := case
      when ticket_index between 7 and 9 then date '2026-07-06' + ((ticket_index - 7) * 7)
      when ticket_index between 13 and 16 then date '2026-07-06' + ((ticket_index - 13) * 7)
      else null
    end;
    closed_date := case
      when ticket_index between 13 and 16 then resolved_date + 4
      else null
    end;

    insert into public.ticket_details (
      work_item_id,
      workspace_id,
      ticket_number,
      ticket_type_id,
      system_priority,
      operational_status,
      received_at,
      resolved_at,
      closed_at,
      form_backup_completed_at
    ) values (
      demo_ticket_id,
      target_workspace_id,
      format('DEMO-INSIGHT-%s', lpad(ticket_index::text, 2, '0')),
      target_ticket_type_id,
      case
        when ticket_index in (1, 10, 13) then 'urgent'::public.ticket_priority
        when mod(ticket_index, 4) = 0 then 'high'::public.ticket_priority
        else 'medium'::public.ticket_priority
      end,
      demo_operational,
      received_date,
      case when resolved_date is null then null else resolved_date::timestamp + time '21:00' end,
      case when closed_date is null then null else closed_date::timestamp + time '21:00' end,
      case when mod(ticket_index, 2) = 0 then date '2026-07-31'::timestamp + time '20:00' else null end
    );

    insert into public.status_events (
      workspace_id, work_item_id, status_dimension, from_value, to_value, changed_by, changed_at
    ) values
      (
        target_workspace_id, demo_ticket_id, 'tracking', null, 'active', target_user_id,
        received_date::timestamp + time '14:00'
      ),
      (
        target_workspace_id, demo_ticket_id, 'operational', null, 'pending', target_user_id,
        received_date::timestamp + time '14:05'
      );

    if ticket_index between 1 and 6 and demo_operational = 'in_progress' then
      insert into public.status_events (
        workspace_id, work_item_id, status_dimension, from_value, to_value, changed_by, changed_at
      ) values (
        target_workspace_id, demo_ticket_id, 'operational', 'pending', 'in_progress', target_user_id,
        date '2026-07-08'::timestamp + time '15:00' + (ticket_index * interval '1 day')
      );
    elsif ticket_index between 7 and 9 then
      insert into public.status_events (
        workspace_id, work_item_id, status_dimension, from_value, to_value, changed_by, changed_at
      ) values
        (
          target_workspace_id, demo_ticket_id, 'operational', 'pending', 'resolved', target_user_id,
          resolved_date::timestamp + time '18:00'
        ),
        (
          target_workspace_id, demo_ticket_id, 'tracking', 'active', 'watching', target_user_id,
          resolved_date::timestamp + time '18:05'
        );
    elsif ticket_index between 10 and 12 then
      insert into public.status_events (
        workspace_id, work_item_id, status_dimension, from_value, to_value, changed_by, changed_at
      ) values
        (
          target_workspace_id, demo_ticket_id, 'operational', 'pending', 'waiting_response', target_user_id,
          (date '2026-07-09' + ((ticket_index - 10) * 6))::timestamp + time '18:00'
        ),
        (
          target_workspace_id, demo_ticket_id, 'tracking', 'active', 'watching', target_user_id,
          (date '2026-07-09' + ((ticket_index - 10) * 6))::timestamp + time '18:05'
        );
    elsif ticket_index between 13 and 16 then
      insert into public.status_events (
        workspace_id, work_item_id, status_dimension, from_value, to_value, changed_by, changed_at
      ) values
        (
          target_workspace_id, demo_ticket_id, 'operational', 'pending', 'resolved', target_user_id,
          resolved_date::timestamp + time '18:00'
        ),
        (
          target_workspace_id, demo_ticket_id, 'tracking', 'active', 'closed', target_user_id,
          closed_date::timestamp + time '18:00'
        );
    end if;
  end loop;

  for demo_date in
    select day::date
    from generate_series(date '2026-07-01', date '2026-07-31', interval '1 day') day
    where extract(isodow from day) between 1 and 5
  loop
    demo_plan_id := null;
    insert into public.daily_plans (
      workspace_id, work_date, status, intention, ready_at, closed_at, end_of_day_step, created_at
    ) values (
      target_workspace_id,
      demo_date,
      'closed',
      '[DEMO] Insights preview plan',
      demo_date::timestamp + time '13:00',
      demo_date::timestamp + time '23:00',
      4,
      demo_date::timestamp + time '12:30'
    ) on conflict (workspace_id, work_date) do nothing
    returning id into demo_plan_id;

    if demo_plan_id is null then
      continue;
    end if;

    for item_position in 0..3 loop
      demo_execution := case
        when item_position = 3 and mod(date_index, 3) = 0 then 'deferred'
        else 'done'
      end;
      demo_outcome := case
        when demo_execution = 'deferred' then 'deferred'
        else 'done'
      end;
      demo_ticket_id := demo_ticket_ids[1 + mod(date_index + item_position * 3, 16)];

      insert into public.daily_plan_items (
        workspace_id,
        daily_plan_id,
        work_item_id,
        position,
        execution_status,
        started_at,
        completed_at,
        outcome_note,
        created_at
      ) values (
        target_workspace_id,
        demo_plan_id,
        demo_ticket_id,
        item_position,
        demo_execution,
        demo_date::timestamp + time '14:00' + (item_position * interval '1 hour'),
        demo_date::timestamp + time '14:45' + (item_position * interval '1 hour'),
        '[DEMO] Synthetic outcome for Insights preview.',
        demo_date::timestamp + time '13:00'
      ) returning id into demo_plan_item_id;

      insert into public.work_logs (
        workspace_id,
        work_item_id,
        daily_plan_item_id,
        worked_on,
        started_at,
        ended_at,
        outcome,
        is_automatic,
        created_at
      ) values (
        target_workspace_id,
        demo_ticket_id,
        demo_plan_item_id,
        demo_date,
        demo_date::timestamp + time '14:00' + (item_position * interval '1 hour'),
        demo_date::timestamp + time '14:45' + (item_position * interval '1 hour'),
        demo_outcome,
        false,
        demo_date::timestamp + time '18:00'
      );
    end loop;

    date_index := date_index + 1;
  end loop;

  insert into public.day_notes (workspace_id, work_date, body, is_important)
  values
    (target_workspace_id, date '2026-07-10', '[DEMO] Insights preview: urgent requests were handled first.', true),
    (target_workspace_id, date '2026-07-20', '[DEMO] Insights preview: waiting volume remained stable.', true),
    (target_workspace_id, date '2026-07-30', '[DEMO] Insights preview: downstream confirmations arrived.', true)
  on conflict (workspace_id, work_date) do nothing;

  raise notice 'Inserted % synthetic Insights tickets.', cardinality(demo_ticket_ids);
end;
$$;

commit;
