-- ===== Enums =====
create type public.task_status as enum ('pending','in_progress','completed','reopened','cancelled','soft_deleted');
create type public.rule_severity as enum ('red_line','caution','recommendation','execution_rule','verification_rule');
create type public.rule_status as enum ('active','disabled','archived');
create type public.artifact_kind as enum ('file','table','api','component','other');
create type public.artifact_action as enum ('created','modified','deleted','inspected');
create type public.decision_status as enum ('active','superseded','reverted');
create type public.conflict_status as enum ('open','investigating','resolved','dismissed');

-- ===== shared trigger =====
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- ===== Project Memory =====
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  name text not null,
  slug text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "owner manages projects" on public.projects for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create trigger trg_projects_touch before update on public.projects for each row execute function public.touch_updated_at();

create table public.project_description (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  description text,
  vision text,
  goal text,
  purpose text,
  problem_solved text,
  target_users text,
  core_principles text[] not null default '{}',
  main_systems text[] not null default '{}',
  main_components text[] not null default '{}',
  technologies text[] not null default '{}',
  architecture text,
  integrations text[] not null default '{}',
  fixed_facts jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.project_description to authenticated;
grant all on public.project_description to service_role;
alter table public.project_description enable row level security;
create policy "owner manages description" on public.project_description for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create trigger trg_desc_touch before update on public.project_description for each row execute function public.touch_updated_at();

create table public.project_description_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  change_reason text,
  changed_by text,
  created_at timestamptz not null default now()
);
grant select, insert on public.project_description_history to authenticated;
grant all on public.project_description_history to service_role;
alter table public.project_description_history enable row level security;
create policy "owner reads desc history" on public.project_description_history for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "owner writes desc history" on public.project_description_history for insert to authenticated
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

create table public.project_execution_summary (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  what_is_project text,
  current_focus text,
  stack text,
  overall_state text,
  operational_constraints text[] not null default '{}',
  last_important_point text,
  current_task_id uuid,
  is_authoritative boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.project_execution_summary to authenticated;
grant all on public.project_execution_summary to service_role;
alter table public.project_execution_summary enable row level security;
create policy "owner manages summary" on public.project_execution_summary for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create trigger trg_summary_touch before update on public.project_execution_summary for each row execute function public.touch_updated_at();

-- ===== Constitution =====
create table public.constitution_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  key text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, key)
);
grant select, insert, update, delete on public.constitution_sections to authenticated;
grant all on public.constitution_sections to service_role;
alter table public.constitution_sections enable row level security;
create policy "owner manages sections" on public.constitution_sections for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create trigger trg_sections_touch before update on public.constitution_sections for each row execute function public.touch_updated_at();

create table public.constitution_rules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  section_id uuid references public.constitution_sections(id) on delete set null,
  code text,
  rule_text text not null,
  rationale text,
  severity public.rule_severity not null default 'execution_rule',
  status public.rule_status not null default 'active',
  keywords text[] not null default '{}',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, code)
);
grant select, insert, update, delete on public.constitution_rules to authenticated;
grant all on public.constitution_rules to service_role;
alter table public.constitution_rules enable row level security;
create policy "owner manages rules" on public.constitution_rules for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create trigger trg_rules_touch before update on public.constitution_rules for each row execute function public.touch_updated_at();

create table public.constitution_rule_history (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.constitution_rules(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  old_rule_text text,
  new_rule_text text,
  old_status public.rule_status,
  new_status public.rule_status,
  change_reason text not null,
  related_task_id uuid,
  approved_by text,
  created_at timestamptz not null default now()
);
grant select, insert on public.constitution_rule_history to authenticated;
grant all on public.constitution_rule_history to service_role;
alter table public.constitution_rule_history enable row level security;
create policy "owner reads rule history" on public.constitution_rule_history for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "owner writes rule history" on public.constitution_rule_history for insert to authenticated
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

-- ===== Task System =====
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  code text,
  title text not null,
  description text,
  goal text,
  reason text,
  status public.task_status not null default 'pending',
  priority integer not null default 3,
  parent_task_id uuid references public.tasks(id) on delete set null,
  scope text,
  execution_approach text,
  execution_steps jsonb not null default '[]'::jsonb,
  success_criteria text,
  testing_method text,
  risks text,
  notes text,
  required_tools text[] not null default '{}',
  required_relations text,
  keywords text[] not null default '{}',
  last_known_good_state text,
  next_action text,
  last_executor text,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, code)
);
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;
create policy "owner manages tasks" on public.tasks for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create trigger trg_tasks_touch before update on public.tasks for each row execute function public.touch_updated_at();
create index idx_tasks_project_status on public.tasks(project_id, status);

alter table public.project_execution_summary
  add constraint fk_summary_current_task foreign key (current_task_id) references public.tasks(id) on delete set null;
alter table public.constitution_rule_history
  add constraint fk_rule_history_task foreign key (related_task_id) references public.tasks(id) on delete set null;

create table public.task_dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks(id) on delete cascade,
  dependency_type text not null default 'blocks',
  created_at timestamptz not null default now(),
  unique (task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id)
);
grant select, insert, update, delete on public.task_dependencies to authenticated;
grant all on public.task_dependencies to service_role;
alter table public.task_dependencies enable row level security;
create policy "owner manages task deps" on public.task_dependencies for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

create table public.task_relations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  related_task_id uuid not null references public.tasks(id) on delete cascade,
  relation_type text not null default 'related',
  note text,
  created_at timestamptz not null default now(),
  unique (task_id, related_task_id, relation_type),
  check (task_id <> related_task_id)
);
grant select, insert, update, delete on public.task_relations to authenticated;
grant all on public.task_relations to service_role;
alter table public.task_relations enable row level security;
create policy "owner manages task relations" on public.task_relations for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

create table public.task_constitution_rules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  rule_id uuid not null references public.constitution_rules(id) on delete cascade,
  relevance_note text,
  created_at timestamptz not null default now(),
  unique (task_id, rule_id)
);
grant select, insert, update, delete on public.task_constitution_rules to authenticated;
grant all on public.task_constitution_rules to service_role;
alter table public.task_constitution_rules enable row level security;
create policy "owner manages task rules" on public.task_constitution_rules for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

create table public.task_changes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  field_name text not null,
  old_value text,
  new_value text,
  change_reason text,
  changed_by text,
  created_at timestamptz not null default now()
);
grant select, insert on public.task_changes to authenticated;
grant all on public.task_changes to service_role;
alter table public.task_changes enable row level security;
create policy "owner reads task changes" on public.task_changes for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "owner writes task changes" on public.task_changes for insert to authenticated
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

-- ===== Execution Memory =====
create table public.task_cycles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  cycle_number integer not null default 1,
  reason text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  outcome text,
  unique (task_id, cycle_number)
);
grant select, insert, update on public.task_cycles to authenticated;
grant all on public.task_cycles to service_role;
alter table public.task_cycles enable row level security;
create policy "owner reads cycles" on public.task_cycles for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "owner writes cycles" on public.task_cycles for insert to authenticated
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "owner updates cycles" on public.task_cycles for update to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

create table public.execution_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  cycle_id uuid references public.task_cycles(id) on delete set null,
  event_type text not null,
  description text not null,
  outcome text,
  details jsonb not null default '{}'::jsonb,
  actor text,
  created_at timestamptz not null default now()
);
grant select, insert on public.execution_logs to authenticated;
grant all on public.execution_logs to service_role;
alter table public.execution_logs enable row level security;
create policy "owner reads logs" on public.execution_logs for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "owner writes logs" on public.execution_logs for insert to authenticated
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create index idx_logs_task_time on public.execution_logs(task_id, created_at desc);

create table public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  cycle_id uuid references public.task_cycles(id) on delete set null,
  status public.task_status not null default 'in_progress',
  is_final boolean not null default false,
  done_summary text not null,
  last_successful_step text not null,
  remaining text,
  next_action text not null,
  changed_files text[] not null default '{}',
  changed_tables text[] not null default '{}',
  changed_apis text[] not null default '{}',
  tests text,
  issues text,
  decisions text,
  actor text,
  created_at timestamptz not null default now()
);
grant select, insert on public.checkpoints to authenticated;
grant all on public.checkpoints to service_role;
alter table public.checkpoints enable row level security;
create policy "owner reads checkpoints" on public.checkpoints for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "owner writes checkpoints" on public.checkpoints for insert to authenticated
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create index idx_checkpoints_task_time on public.checkpoints(task_id, created_at desc);

create table public.resume_packages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  cycle_id uuid references public.task_cycles(id) on delete set null,
  is_active boolean not null default true,
  current_state text,
  completed text,
  remaining text,
  last_known_good_state text,
  next_action text not null,
  relevant_files text[] not null default '{}',
  relevant_tables text[] not null default '{}',
  relevant_apis text[] not null default '{}',
  relevant_decisions text[] not null default '{}',
  relevant_rules text[] not null default '{}',
  last_checkpoint_id uuid references public.checkpoints(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uniq_active_resume_per_task on public.resume_packages(task_id) where is_active;
grant select, insert, update on public.resume_packages to authenticated;
grant all on public.resume_packages to service_role;
alter table public.resume_packages enable row level security;
create policy "owner manages resume packages" on public.resume_packages for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "owner inserts resume packages" on public.resume_packages for insert to authenticated
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "owner updates resume packages" on public.resume_packages for update to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create trigger trg_resume_touch before update on public.resume_packages for each row execute function public.touch_updated_at();

-- ===== Decision Memory =====
create table public.project_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  decision text not null,
  reason text not null,
  alternatives text,
  impact text,
  status public.decision_status not null default 'active',
  superseded_by uuid references public.project_decisions(id) on delete set null,
  decided_by text,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.project_decisions to authenticated;
grant all on public.project_decisions to service_role;
alter table public.project_decisions enable row level security;
create policy "owner manages decisions" on public.project_decisions for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create trigger trg_decisions_touch before update on public.project_decisions for each row execute function public.touch_updated_at();

-- ===== Project Artifacts =====
create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind public.artifact_kind not null,
  identifier text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, kind, identifier)
);
grant select, insert, update, delete on public.artifacts to authenticated;
grant all on public.artifacts to service_role;
alter table public.artifacts enable row level security;
create policy "owner manages artifacts" on public.artifacts for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create trigger trg_artifacts_touch before update on public.artifacts for each row execute function public.touch_updated_at();

create table public.task_artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  artifact_id uuid not null references public.artifacts(id) on delete cascade,
  action public.artifact_action not null default 'modified',
  purpose text,
  cycle_id uuid references public.task_cycles(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.task_artifacts to authenticated;
grant all on public.task_artifacts to service_role;
alter table public.task_artifacts enable row level security;
create policy "owner manages task artifacts" on public.task_artifacts for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create index idx_task_artifacts_task on public.task_artifacts(task_id);

-- ===== Conflict Memory =====
create table public.state_conflicts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  description text not null,
  inspected_scope text,
  finding text,
  resolution text,
  status public.conflict_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.state_conflicts to authenticated;
grant all on public.state_conflicts to service_role;
alter table public.state_conflicts enable row level security;
create policy "owner manages conflicts" on public.state_conflicts for all to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create trigger trg_conflicts_touch before update on public.state_conflicts for each row execute function public.touch_updated_at();

-- ===== T11: Minimal Task Context =====
create or replace function public.get_minimal_task_context(_task_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'task', to_jsonb(t) - 'description',
    'task_description', t.description,
    'resume_package', (select to_jsonb(r) from public.resume_packages r where r.task_id = t.id and r.is_active limit 1),
    'last_checkpoint', (select to_jsonb(c) from public.checkpoints c where c.task_id = t.id order by c.created_at desc limit 1),
    'relevant_decisions', coalesce((select jsonb_agg(to_jsonb(d)) from public.project_decisions d where d.task_id = t.id and d.status = 'active'), '[]'::jsonb),
    'relevant_constitution_rules', coalesce((select jsonb_agg(jsonb_build_object('code', cr.code, 'severity', cr.severity, 'rule_text', cr.rule_text, 'note', tcr.relevance_note))
        from public.task_constitution_rules tcr join public.constitution_rules cr on cr.id = tcr.rule_id
        where tcr.task_id = t.id and cr.status = 'active'), '[]'::jsonb),
    'registered_artifacts', coalesce((select jsonb_agg(jsonb_build_object('kind', a.kind, 'identifier', a.identifier, 'action', ta.action, 'purpose', ta.purpose))
        from public.task_artifacts ta join public.artifacts a on a.id = ta.artifact_id where ta.task_id = t.id), '[]'::jsonb),
    'dependencies', coalesce((select jsonb_agg(jsonb_build_object('code', dt.code, 'title', dt.title, 'status', dt.status))
        from public.task_dependencies td join public.tasks dt on dt.id = td.depends_on_task_id where td.task_id = t.id), '[]'::jsonb),
    'open_conflicts', coalesce((select jsonb_agg(to_jsonb(sc)) from public.state_conflicts sc where sc.task_id = t.id and sc.status in ('open','investigating')), '[]'::jsonb),
    'recent_logs', coalesce((select jsonb_agg(jsonb_build_object('event_type', l.event_type, 'description', l.description, 'outcome', l.outcome, 'at', l.created_at))
        from (select * from public.execution_logs el where el.task_id = t.id order by el.created_at desc limit 10) l), '[]'::jsonb)
  )
  from public.tasks t
  where t.id = _task_id;
$$;
grant execute on function public.get_minimal_task_context(uuid) to authenticated, service_role;