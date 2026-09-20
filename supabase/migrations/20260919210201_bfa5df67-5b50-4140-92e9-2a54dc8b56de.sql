
DROP TRIGGER IF EXISTS trg_audit_system_versions ON public.system_versions;
DROP TRIGGER IF EXISTS trg_audit_version_adoptions ON public.version_adoptions;

REVOKE ALL ON FUNCTION public.log_audit_event() FROM PUBLIC, anon, authenticated;

-- إزالة أي تكرار ناتج عن التعبئة التاريخية مقابل التسجيل التلقائي القائم
DELETE FROM public.audit_logs a
USING public.audit_logs b
WHERE a.source = 'backfill'
  AND b.id <> a.id
  AND b.source <> 'backfill'
  AND b.entity_table = a.entity_table
  AND b.entity_id = a.entity_id;
