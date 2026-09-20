REVOKE ALL ON FUNCTION public.claim_unowned_projects() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_unowned_projects() FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_unowned_projects() TO authenticated;