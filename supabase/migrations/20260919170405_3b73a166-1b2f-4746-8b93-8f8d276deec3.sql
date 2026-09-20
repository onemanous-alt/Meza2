create table if not exists public.system_draft_proposals (
  id uuid primary key default gen_random_uuid(),
  system_id uuid not null,
  user_id uuid not null default auth.uid(),
  base_version_id uuid references public.system_versions(id) on delete set null,
  parent_proposal_id uuid references public.system_draft_proposals(id) on delete set null,
  revision_number integer not null default 1,
  knowledge_type text not null default 'PROPOSAL',
  status text not null default 'pending',
  name text,
  change_summary text not null,
  advantages text,
  components jsonb not null default '[]'::jsonb,
  changes jsonb not null default '[]'::jsonb,
  instruction text,
  source_evidence jsonb not null default '{}'::jsonb,
  model text,
  applied_version_id uuid references public.system_versions(id) on delete set null,
  occurred_at timestamptz not null default now(),
  recorded_at timestamptz not null default now(),
  recorded_by text not null default 'ai',
  source text not null default 'chat_ai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sdp_status_chk check (status in ('pending','applied','discarded','superseded')),
  constraint sdp_knowledge_chk check (knowledge_type = 'PROPOSAL'),
  constraint sdp_system_fk foreign key (system_id, user_id) references public.operating_systems(id, user_id) on delete cascade
);

create index if not exists sdp_system_idx on public.system_draft_proposals (system_id, created_at desc);

grant select, insert, update on public.system_draft_proposals to authenticated;
grant all on public.system_draft_proposals to service_role;

alter table public.system_draft_proposals enable row level security;

create policy "own proposals read" on public.system_draft_proposals
  for select to authenticated using (user_id = auth.uid());
create policy "own proposals insert" on public.system_draft_proposals
  for insert to authenticated with check (user_id = auth.uid());
create policy "own proposals update" on public.system_draft_proposals
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger sdp_owner before insert or update on public.system_draft_proposals
  for each row execute function public.enforce_owner_user_id();
create trigger sdp_touch before update on public.system_draft_proposals
  for each row execute function public.touch_updated_at();

-- تطبيق مسودة مقترحة على مساحة عمل المسودة (لا يعتمد نسخة، الاعتماد يبقى بيد المستخدم)
create or replace function public.apply_proposal_to_draft(_proposal_id uuid)
returns integer
language plpgsql
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _p record;
  _c jsonb;
  _n integer := 0;
  _i integer := 0;
begin
  if _uid is null then
    raise exception 'authentication required';
  end if;
  select * into _p from public.system_draft_proposals
  where id = _proposal_id and user_id = _uid;
  if _p is null then
    raise exception 'proposal not found';
  end if;
  if jsonb_typeof(_p.components) <> 'array' or jsonb_array_length(_p.components) = 0 then
    raise exception 'proposal has no components';
  end if;

  delete from public.system_component_drafts where system_id = _p.system_id;

  for _c in select * from jsonb_array_elements(_p.components)
  loop
    _i := _i + 1;
    insert into public.system_component_drafts (system_id, key, title, kind, body, sort_order, status)
    values (
      _p.system_id,
      coalesce(nullif(btrim(_c->>'key'), ''), 'component-' || _i),
      coalesce(nullif(btrim(_c->>'title'), ''), 'مكوّن ' || _i),
      coalesce(nullif(btrim(_c->>'kind'), ''), 'principle'),
      coalesce(_c->>'body', ''),
      coalesce((_c->>'sort_order')::int, _i * 10),
      'active'
    );
    _n := _n + 1;
  end loop;

  return _n;
end;
$$;

grant execute on function public.apply_proposal_to_draft(uuid) to authenticated;