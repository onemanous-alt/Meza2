DROP FUNCTION IF EXISTS public.claim_unowned_projects();

CREATE POLICY "claim unowned project" ON public.projects
FOR UPDATE TO authenticated
USING (owner_id = '00000000-0000-0000-0000-000000000001'::uuid)
WITH CHECK (owner_id = auth.uid());