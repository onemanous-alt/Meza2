ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'blocked';
ALTER TYPE public.artifact_action ADD VALUE IF NOT EXISTS 'verified';

CREATE TABLE IF NOT EXISTS public.phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  key text not null,
  title text not null,
  description text,
  status text not null default 'pending',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.phases TO authenticated;
GRANT ALL ON public.phases TO service_role;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages phases" ON public.phases FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = phases.project_id AND p.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = phases.project_id AND p.owner_id = auth.uid()));

CREATE TRIGGER phases_touch BEFORE UPDATE ON public.phases
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS phase_id uuid REFERENCES public.phases(id) ON DELETE SET NULL;
ALTER TABLE public.project_decisions ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.state_conflicts ADD COLUMN IF NOT EXISTS source_a text;
ALTER TABLE public.state_conflicts ADD COLUMN IF NOT EXISTS source_b text;

CREATE OR REPLACE FUNCTION public.claim_unowned_projects()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  UPDATE public.projects
     SET owner_id = auth.uid()
   WHERE owner_id = '00000000-0000-0000-0000-000000000001'::uuid;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_unowned_projects() TO authenticated;