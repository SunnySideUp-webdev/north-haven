create or replace function public.delete_personal_workspace_before_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.workspaces as workspace
  where exists (
    select 1
    from public.workspace_members as owner_membership
    where owner_membership.workspace_id = workspace.id
      and owner_membership.profile_id = old.id
      and owner_membership.role = 'owner'
  )
  and not exists (
    select 1
    from public.workspace_members as other_membership
    where other_membership.workspace_id = workspace.id
      and other_membership.profile_id <> old.id
  );

  return old;
end;
$$;

drop trigger if exists before_auth_user_deleted on auth.users;
create trigger before_auth_user_deleted
  before delete on auth.users
  for each row execute procedure public.delete_personal_workspace_before_auth_user();

revoke all on function public.delete_personal_workspace_before_auth_user() from public;
