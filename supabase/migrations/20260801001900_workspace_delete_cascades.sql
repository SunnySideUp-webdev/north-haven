alter table public.daily_plan_items
  drop constraint daily_plan_items_work_item_id_workspace_id_fkey,
  add constraint daily_plan_items_work_item_id_workspace_id_fkey
    foreign key (work_item_id, workspace_id)
    references public.work_items (id, workspace_id)
    on delete cascade;

alter table public.work_logs
  drop constraint work_logs_work_item_id_workspace_id_fkey,
  add constraint work_logs_work_item_id_workspace_id_fkey
    foreign key (work_item_id, workspace_id)
    references public.work_items (id, workspace_id)
    on delete cascade,
  drop constraint work_logs_daily_plan_item_id_workspace_id_fkey,
  add constraint work_logs_daily_plan_item_id_workspace_id_fkey
    foreign key (daily_plan_item_id, workspace_id)
    references public.daily_plan_items (id, workspace_id)
    on delete cascade;
