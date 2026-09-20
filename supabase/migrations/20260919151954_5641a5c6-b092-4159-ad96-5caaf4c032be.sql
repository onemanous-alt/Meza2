-- =========================================================
-- Phase 1 Data Model (P1-T02) — approved design v2
-- =========================================================

-- ---------- helper: enforce owner ----------
create or replace function public.enforce_owner_user_id()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is not null then
    new.user_id := auth.uid();
  elsif new.user_id is null then
    raise exception 'user_id is required';
  end if;
  return new;
end; $$;

-- ---------- helper: immutability guard ----------
create or replace function public.forbid_update_delete()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  raise exception 'historical record cannot be updated or deleted (%): %', tg_table_name, tg_op;
end; $$;

-- ---------- helper: provenance guard ----------
create or replace function public.enforce_provenance()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is not null then
    if new.source in ('trigger','server_fn') then
      raise exception 'source % is reserved for trusted server layer', new.source;
    end if;
    new.recorded_by := auth.uid()::text;
  elsif new.recorded_by is null then
    new.recorded_by := 'system';
  end if;
  new.recorded_at := now();
  return new;
end; $$;

-- =========================================================
-- 1. profiles
-- =========================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  display_name text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (user_id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- =========================================================
-- 2. operating_systems
-- =========================================================
create table public.operating_systems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operating_systems_status_chk check (status in ('active','archived')),
  constraint operating_systems_id_user_key unique (id, user_id)
);
grant select, insert, update on public.operating_systems to authenticated;
grant all on public.operating_systems to service_role;
alter table public.operating_systems enable row level security;
create policy "os_select_own" on public.operating_systems for select to authenticated using (user_id = auth.uid());
create policy "os_insert_own" on public.operating_systems for insert to authenticated with check (user_id = auth.uid());
create policy "os_update_own" on public.operating_systems for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger os_owner before insert or update on public.operating_systems for each row execute function public.enforce_owner_user_id();
create trigger os_touch before update on public.operating_systems for each row execute function public.touch_updated_at();
create index operating_systems_user_status_idx on public.operating_systems (user_id, status);

-- =========================================================
-- 3. system_versions
-- =========================================================
create table public.system_versions (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null,
  user_id uuid not null,
  version_number integer not null,
  name text,
  snapshot jsonb not null,
  snapshot_hash text not null,
  parent_version_id uuid,
  change_summary text not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  recorded_by text not null,
  source text not null default 'user',
  created_at timestamptz not null default now(),
  constraint system_versions_number_chk check (version_number > 0),
  constraint system_versions_no_self_parent_chk check (parent_version_id is null or parent_version_id <> id),
  constraint system_versions_source_chk check (source in ('user','import','ai_suggestion_confirmed','trigger','server_fn')),
  constraint system_versions_system_number_key unique (system_id, version_number),
  constraint system_versions_id_system_key unique (id, system_id),
  constraint system_versions_id_user_key unique (id, user_id),
  constraint system_versions_system_fk foreign key (system_id, user_id) references public.operating_systems (id, user_id),
  constraint system_versions_parent_fk foreign key (parent_version_id, system_id) references public.system_versions (id, system_id)
);
grant select, insert on public.system_versions to authenticated;
grant all on public.system_versions to service_role;
alter table public.system_versions enable row level security;
create policy "sv_select_own" on public.system_versions for select to authenticated using (user_id = auth.uid());
create policy "sv_insert_own" on public.system_versions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.operating_systems o where o.id = system_id and o.user_id = auth.uid())
  );
create trigger sv_owner before insert on public.system_versions for each row execute function public.enforce_owner_user_id();
create trigger sv_provenance before insert on public.system_versions for each row execute function public.enforce_provenance();
create trigger sv_immutable before update or delete on public.system_versions for each row execute function public.forbid_update_delete();
create index system_versions_system_number_idx on public.system_versions (system_id, version_number);
create index system_versions_system_occurred_idx on public.system_versions (system_id, occurred_at);

-- =========================================================
-- 4. system_components
-- =========================================================
create table public.system_components (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null,
  user_id uuid not null,
  key text not null,
  title text not null,
  kind text not null default 'practice',
  status text not null default 'active',
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_components_status_chk check (status in ('active','retired')),
  constraint system_components_system_key_key unique (system_id, key),
  constraint system_components_id_system_key unique (id, system_id),
  constraint system_components_id_user_key unique (id, user_id),
  constraint system_components_system_fk foreign key (system_id, user_id) references public.operating_systems (id, user_id)
);
grant select, insert, update on public.system_components to authenticated;
grant all on public.system_components to service_role;
alter table public.system_components enable row level security;
create policy "sc_select_own" on public.system_components for select to authenticated using (user_id = auth.uid());
create policy "sc_insert_own" on public.system_components for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.operating_systems o where o.id = system_id and o.user_id = auth.uid())
  );
create policy "sc_update_own" on public.system_components for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger sc_owner before insert or update on public.system_components for each row execute function public.enforce_owner_user_id();
create trigger sc_touch before update on public.system_components for each row execute function public.touch_updated_at();
create index system_components_system_key_idx on public.system_components (system_id, key);
create index system_components_system_status_idx on public.system_components (system_id, status);

-- =========================================================
-- 5. system_component_versions
-- =========================================================
create table public.system_component_versions (
  id uuid primary key default gen_random_uuid(),
  component_id uuid not null,
  system_id uuid not null,
  user_id uuid not null,
  system_version_id uuid not null,
  version_number integer not null,
  previous_version_id uuid,
  title text not null,
  kind text not null,
  lifecycle_state text not null default 'active',
  definition jsonb not null default '{}'::jsonb,
  change_reason text not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  recorded_by text not null,
  source text not null default 'user',
  created_at timestamptz not null default now(),
  constraint scv_number_chk check (version_number > 0),
  constraint scv_no_self_prev_chk check (previous_version_id is null or previous_version_id <> id),
  constraint scv_lifecycle_chk check (lifecycle_state in ('active','retired')),
  constraint scv_source_chk check (source in ('user','import','ai_suggestion_confirmed','trigger','server_fn')),
  constraint scv_component_number_key unique (component_id, version_number),
  constraint scv_id_component_key unique (id, component_id),
  constraint scv_id_system_key unique (id, system_id),
  constraint scv_prev_unique unique (component_id, previous_version_id),
  constraint scv_system_fk foreign key (system_id, user_id) references public.operating_systems (id, user_id),
  constraint scv_component_fk foreign key (component_id, system_id) references public.system_components (id, system_id),
  constraint scv_system_version_fk foreign key (system_version_id, system_id) references public.system_versions (id, system_id),
  constraint scv_prev_fk foreign key (previous_version_id, component_id) references public.system_component_versions (id, component_id)
);
grant select, insert on public.system_component_versions to authenticated;
grant all on public.system_component_versions to service_role;
alter table public.system_component_versions enable row level security;
create policy "scv_select_own" on public.system_component_versions for select to authenticated using (user_id = auth.uid());
create policy "scv_insert_own" on public.system_component_versions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.operating_systems o where o.id = system_id and o.user_id = auth.uid())
  );

create or replace function public.scv_validate_lineage()
returns trigger language plpgsql security invoker set search_path = public as $$
declare prev_number integer;
begin
  if new.previous_version_id is null then
    if new.version_number <> 1 then
      raise exception 'first component version must have version_number = 1';
    end if;
  else
    if new.version_number = 1 then
      raise exception 'version_number 1 must not have a previous version';
    end if;
    select version_number into prev_number
    from public.system_component_versions
    where id = new.previous_version_id;
    if prev_number is null then
      raise exception 'previous component version not found';
    end if;
    if prev_number >= new.version_number then
      raise exception 'lineage must be strictly increasing (previous=%, new=%)', prev_number, new.version_number;
    end if;
  end if;
  return new;
end; $$;

create trigger scv_owner before insert on public.system_component_versions for each row execute function public.enforce_owner_user_id();
create trigger scv_provenance before insert on public.system_component_versions for each row execute function public.enforce_provenance();
create trigger scv_lineage before insert on public.system_component_versions for each row execute function public.scv_validate_lineage();
create trigger scv_immutable before update or delete on public.system_component_versions for each row execute function public.forbid_update_delete();
create index scv_component_number_idx on public.system_component_versions (component_id, version_number);
create index scv_system_version_idx on public.system_component_versions (system_version_id);
create index scv_previous_idx on public.system_component_versions (previous_version_id);

alter table public.system_components
  add constraint system_components_current_version_fk
  foreign key (current_version_id, id) references public.system_component_versions (id, component_id);

-- =========================================================
-- 6. version_adoptions
-- =========================================================
create table public.version_adoptions (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null,
  user_id uuid not null,
  system_version_id uuid not null,
  sequence_no bigint not null default 0,
  adoption_type text not null,
  supersedes_adoption_id uuid,
  reason text,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  recorded_by text not null,
  source text not null default 'user',
  created_at timestamptz not null default now(),
  constraint va_type_chk check (adoption_type in ('adopt','rollback','re_adopt')),
  constraint va_source_chk check (source in ('user','import','ai_suggestion_confirmed','trigger','server_fn')),
  constraint va_no_self_supersede_chk check (supersedes_adoption_id is null or supersedes_adoption_id <> id),
  constraint va_system_sequence_key unique (system_id, sequence_no),
  constraint va_id_system_key unique (id, system_id),
  constraint va_system_fk foreign key (system_id, user_id) references public.operating_systems (id, user_id),
  constraint va_system_version_fk foreign key (system_version_id, system_id) references public.system_versions (id, system_id),
  constraint va_supersedes_fk foreign key (supersedes_adoption_id, system_id) references public.version_adoptions (id, system_id)
);
grant select, insert on public.version_adoptions to authenticated;
grant all on public.version_adoptions to service_role;
alter table public.version_adoptions enable row level security;
create policy "va_select_own" on public.version_adoptions for select to authenticated using (user_id = auth.uid());
create policy "va_insert_own" on public.version_adoptions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.operating_systems o where o.id = system_id and o.user_id = auth.uid())
  );

create or replace function public.va_assign_sequence()
returns trigger language plpgsql security definer set search_path = public as $$
declare next_no bigint;
begin
  perform pg_advisory_xact_lock(hashtext(new.system_id::text)::bigint);
  select coalesce(max(sequence_no), 0) + 1 into next_no
  from public.version_adoptions where system_id = new.system_id;
  new.sequence_no := next_no;

  if new.adoption_type in ('rollback','re_adopt') and (new.reason is null or btrim(new.reason) = '') then
    raise exception 'reason is required for % events', new.adoption_type;
  end if;
  return new;
end; $$;

create trigger va_owner before insert on public.version_adoptions for each row execute function public.enforce_owner_user_id();
create trigger va_provenance before insert on public.version_adoptions for each row execute function public.enforce_provenance();
create trigger va_sequence before insert on public.version_adoptions for each row execute function public.va_assign_sequence();
create trigger va_immutable before update or delete on public.version_adoptions for each row execute function public.forbid_update_delete();
create index va_system_sequence_idx on public.version_adoptions (system_id, sequence_no desc);
create index va_system_timeline_idx on public.version_adoptions (system_id, occurred_at desc, sequence_no desc);

-- =========================================================
-- 7. audit_logs (write-only from trusted layer)
-- =========================================================
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  entity_table text not null,
  entity_id uuid not null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  actor text not null,
  source text not null,
  constraint audit_logs_source_chk check (source in ('trigger','server_fn'))
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "audit_select_own" on public.audit_logs for select to authenticated using (user_id = auth.uid());
create trigger audit_immutable before update or delete on public.audit_logs for each row execute function public.forbid_update_delete();
create index audit_logs_user_occurred_idx on public.audit_logs (user_id, occurred_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_table, entity_id);

create or replace function public.write_audit_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_action text;
  v_occurred timestamptz;
  v_details jsonb;
begin
  v_action := lower(tg_table_name) || '_' || lower(tg_op);
  v_occurred := coalesce(
    (to_jsonb(new) ->> 'occurred_at')::timestamptz,
    (to_jsonb(new) ->> 'updated_at')::timestamptz,
    now()
  );
  v_details := to_jsonb(new) - 'snapshot' - 'definition';

  insert into public.audit_logs (user_id, entity_table, entity_id, action, details, occurred_at, actor, source)
  values (new.user_id, tg_table_name, new.id, v_action, v_details, v_occurred,
          coalesce(auth.uid()::text, 'system'), 'trigger');
  return null;
end; $$;

create trigger os_audit after insert or update on public.operating_systems for each row execute function public.write_audit_log();
create trigger sc_audit after insert or update on public.system_components for each row execute function public.write_audit_log();
create trigger sv_audit after insert on public.system_versions for each row execute function public.write_audit_log();
create trigger scv_audit after insert on public.system_component_versions for each row execute function public.write_audit_log();
create trigger va_audit after insert on public.version_adoptions for each row execute function public.write_audit_log();

-- =========================================================
-- Historical reads
-- =========================================================
create or replace function public.os_version_at(_system_id uuid, _at timestamptz)
returns uuid language sql stable security invoker set search_path = public as $$
  select va.system_version_id
  from public.version_adoptions va
  where va.system_id = _system_id
    and va.occurred_at <= _at
  order by va.occurred_at desc, va.sequence_no desc
  limit 1
$$;

create or replace function public.verify_system_version_snapshot(_system_version_id uuid)
returns boolean language sql stable security invoker set search_path = public as $$
  select coalesce(jsonb_array_length(sv.snapshot -> 'components'), 0)
         = (select count(*) from public.system_component_versions scv where scv.system_version_id = sv.id)
  from public.system_versions sv
  where sv.id = _system_version_id
$$;

create view public.v_system_current_version
with (security_invoker = true) as
select distinct on (va.system_id)
  va.system_id,
  va.user_id,
  va.system_version_id,
  va.id as adoption_id,
  va.sequence_no,
  va.adoption_type,
  va.occurred_at,
  va.recorded_at
from public.version_adoptions va
order by va.system_id, va.sequence_no desc;

create view public.v_adoption_timeline
with (security_invoker = true) as
select
  va.system_id,
  va.user_id,
  va.id as adoption_id,
  va.system_version_id,
  va.sequence_no,
  va.adoption_type,
  va.supersedes_adoption_id,
  va.reason,
  va.occurred_at,
  va.recorded_at,
  va.recorded_by,
  va.source
from public.version_adoptions va
order by va.system_id, va.occurred_at, va.sequence_no;

grant select on public.v_system_current_version to authenticated;
grant select on public.v_adoption_timeline to authenticated;
grant select on public.v_system_current_version to service_role;
grant select on public.v_adoption_timeline to service_role;