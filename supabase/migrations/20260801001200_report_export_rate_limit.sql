create table public.report_export_attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references auth.users (id) on delete cascade,
  requested_at timestamptz not null default now()
);

create index report_export_attempts_profile_requested_idx
  on public.report_export_attempts (profile_id, requested_at desc);

alter table public.report_export_attempts enable row level security;
revoke all on table public.report_export_attempts from public, anon, authenticated;

create or replace function public.claim_report_export_slot()
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_profile_id uuid := auth.uid();
  recent_attempts integer;
begin
  if current_profile_id is null then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_profile_id::text, 0));

  delete from public.report_export_attempts
  where profile_id = current_profile_id
    and requested_at < now() - interval '1 day';

  select count(*) into recent_attempts
  from public.report_export_attempts
  where profile_id = current_profile_id
    and requested_at > now() - interval '1 minute';

  if recent_attempts >= 6 then
    return false;
  end if;

  insert into public.report_export_attempts (profile_id)
  values (current_profile_id);
  return true;
end;
$$;

revoke all on function public.claim_report_export_slot() from public;
grant execute on function public.claim_report_export_slot() to authenticated;
