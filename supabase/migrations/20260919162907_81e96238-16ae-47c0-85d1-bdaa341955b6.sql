create table if not exists public.system_component_drafts (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null,
  user_id uuid not null default auth.uid(),
  key text not null,
  title text not null,
  kind text not null default 'principle',
  body text not null default '',
  sort_order integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scd_status_chk check (status in ('active','retired')),
  constraint scd_system_key_key unique (system_id, key),
  constraint scd_system_fk foreign key (system_id, user_id) references public.operating_systems(id, user_id) on delete cascade
);

grant select, insert, update, delete on public.system_component_drafts to authenticated;
grant all on public.system_component_drafts to service_role;

alter table public.system_component_drafts enable row level security;

create policy "own drafts" on public.system_component_drafts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger scd_owner before insert or update on public.system_component_drafts
  for each row execute function public.enforce_owner_user_id();
create trigger scd_touch before update on public.system_component_drafts
  for each row execute function public.touch_updated_at();

create or replace function public.publish_system_version(
  _system_id uuid,
  _change_summary text,
  _name text default null,
  _occurred_at timestamptz default now()
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _version_id uuid;
  _next_number integer;
  _parent_id uuid;
  _snapshot jsonb;
  _d record;
  _comp_id uuid;
  _prev_id uuid;
  _prev_number integer;
  _new_scv uuid;
begin
  if _uid is null then
    raise exception 'authentication required';
  end if;
  if not exists (select 1 from public.operating_systems o where o.id = _system_id and o.user_id = _uid) then
    raise exception 'system not found';
  end if;
  if coalesce(btrim(_change_summary), '') = '' then
    raise exception 'change summary is required';
  end if;
  if not exists (select 1 from public.system_component_drafts d where d.system_id = _system_id and d.status = 'active') then
    raise exception 'draft is empty';
  end if;

  select coalesce(max(version_number), 0) + 1 into _next_number
  from public.system_versions where system_id = _system_id;

  select id into _parent_id
  from public.system_versions where system_id = _system_id
  order by version_number desc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
           'key', d.key, 'title', d.title, 'kind', d.kind,
           'definition', jsonb_build_object('body', d.body),
           'lifecycle_state', d.status, 'sort_order', d.sort_order
         ) order by d.sort_order, d.key), '[]'::jsonb)
    into _snapshot
  from public.system_component_drafts d
  where d.system_id = _system_id and d.status = 'active';

  _snapshot := jsonb_build_object('components', _snapshot);

  insert into public.system_versions
    (system_id, version_number, name, change_summary, snapshot, snapshot_hash,
     source, occurred_at, parent_version_id, recorded_by)
  values
    (_system_id, _next_number, nullif(btrim(coalesce(_name, '')), ''), _change_summary,
     _snapshot, md5(_snapshot::text), 'user', coalesce(_occurred_at, now()), _parent_id, _uid::text)
  returning id into _version_id;

  for _d in
    select * from public.system_component_drafts
    where system_id = _system_id and status = 'active'
    order by sort_order, key
  loop
    select id, current_version_id into _comp_id, _prev_id
    from public.system_components
    where system_id = _system_id and key = _d.key;

    if _comp_id is null then
      insert into public.system_components (system_id, key, title, kind, status)
      values (_system_id, _d.key, _d.title, _d.kind, 'active')
      returning id into _comp_id;
      _prev_id := null;
    end if;

    _prev_number := 0;
    if _prev_id is not null then
      select version_number into _prev_number
      from public.system_component_versions where id = _prev_id;
    end if;

    insert into public.system_component_versions
      (system_id, component_id, system_version_id, version_number, previous_version_id,
       title, kind, definition, lifecycle_state, change_reason, source, occurred_at, recorded_by)
    values
      (_system_id, _comp_id, _version_id, coalesce(_prev_number, 0) + 1, _prev_id,
       _d.title, _d.kind, jsonb_build_object('body', _d.body), 'active',
       _change_summary, 'user', coalesce(_occurred_at, now()), _uid::text)
    returning id into _new_scv;

    update public.system_components
    set current_version_id = _new_scv, title = _d.title, kind = _d.kind, status = 'active'
    where id = _comp_id;
  end loop;

  insert into public.version_adoptions
    (system_id, system_version_id, adoption_type, reason, source, occurred_at, recorded_by)
  values
    (_system_id, _version_id, 'adopt', _change_summary, 'user', coalesce(_occurred_at, now()), _uid::text);

  return _version_id;
end;
$$;

grant execute on function public.publish_system_version(uuid, text, text, timestamptz) to authenticated;