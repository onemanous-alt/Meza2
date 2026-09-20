
-- 1) صلاحيات القراءة ومنع التعديل على سجل التدقيق
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

DROP POLICY IF EXISTS audit_no_update ON public.audit_logs;
DROP POLICY IF EXISTS audit_no_delete ON public.audit_logs;
CREATE POLICY audit_no_update ON public.audit_logs AS RESTRICTIVE FOR UPDATE TO authenticated USING (false);
CREATE POLICY audit_no_delete ON public.audit_logs AS RESTRICTIVE FOR DELETE TO authenticated USING (false);

-- 2) دالة تسجيل عامة
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_action text;
  v_details jsonb := '{}'::jsonb;
  v_occurred timestamptz := now();
  v_actor text := 'user';
  v_user uuid;
  v_entity uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN v_row := OLD; ELSE v_row := NEW; END IF;
  v_user := v_row.user_id;
  v_entity := v_row.id;
  IF v_user IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  IF TG_TABLE_NAME = 'version_adoptions' THEN
    v_action := CASE v_row.adoption_type
      WHEN 'rollback' THEN 'rollback'
      WHEN 're_adopt' THEN 're_adopt'
      ELSE 'adopt' END;
    v_occurred := v_row.occurred_at;
    v_actor := COALESCE(v_row.recorded_by, 'user');
    v_details := jsonb_build_object(
      'system_id', v_row.system_id,
      'system_version_id', v_row.system_version_id,
      'adoption_type', v_row.adoption_type,
      'reason', v_row.reason,
      'sequence_no', v_row.sequence_no
    );
  ELSIF TG_TABLE_NAME = 'system_versions' THEN
    v_action := 'publish_version';
    v_occurred := v_row.occurred_at;
    v_actor := COALESCE(v_row.recorded_by, 'user');
    v_details := jsonb_build_object(
      'system_id', v_row.system_id,
      'version_number', v_row.version_number,
      'name', v_row.name,
      'change_summary', v_row.change_summary
    );
  ELSIF TG_TABLE_NAME = 'system_component_drafts' THEN
    v_action := CASE TG_OP WHEN 'INSERT' THEN 'draft_create'
                           WHEN 'UPDATE' THEN 'draft_update'
                           ELSE 'draft_delete' END;
    v_details := jsonb_build_object(
      'system_id', v_row.system_id,
      'key', v_row.key,
      'title', v_row.title,
      'kind', v_row.kind
    );
    IF TG_OP = 'UPDATE' THEN
      v_details := v_details || jsonb_build_object(
        'previous_title', OLD.title,
        'previous_kind', OLD.kind,
        'body_changed', (OLD.body IS DISTINCT FROM NEW.body)
      );
    END IF;
  ELSE
    v_action := lower(TG_OP);
  END IF;

  INSERT INTO public.audit_logs (user_id, entity_table, entity_id, action, details, occurred_at, actor, source)
  VALUES (v_user, TG_TABLE_NAME, v_entity, v_action, v_details, v_occurred, v_actor, 'app');

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3) المشغّلات
DROP TRIGGER IF EXISTS trg_audit_version_adoptions ON public.version_adoptions;
CREATE TRIGGER trg_audit_version_adoptions
AFTER INSERT ON public.version_adoptions
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS trg_audit_system_versions ON public.system_versions;
CREATE TRIGGER trg_audit_system_versions
AFTER INSERT ON public.system_versions
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS trg_audit_drafts ON public.system_component_drafts;
CREATE TRIGGER trg_audit_drafts
AFTER INSERT OR UPDATE OR DELETE ON public.system_component_drafts
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- 4) تعبئة السجلات التاريخية للعمليات السابقة (دون تكرار)
INSERT INTO public.audit_logs (user_id, entity_table, entity_id, action, details, occurred_at, actor, source)
SELECT v.user_id, 'system_versions', v.id, 'publish_version',
       jsonb_build_object('system_id', v.system_id, 'version_number', v.version_number, 'name', v.name, 'change_summary', v.change_summary),
       v.occurred_at, COALESCE(v.recorded_by, 'user'), 'backfill'
FROM public.system_versions v
WHERE v.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.audit_logs a WHERE a.entity_table = 'system_versions' AND a.entity_id = v.id);

INSERT INTO public.audit_logs (user_id, entity_table, entity_id, action, details, occurred_at, actor, source)
SELECT a2.user_id, 'version_adoptions', a2.id,
       CASE a2.adoption_type WHEN 'rollback' THEN 'rollback' WHEN 're_adopt' THEN 're_adopt' ELSE 'adopt' END,
       jsonb_build_object('system_id', a2.system_id, 'system_version_id', a2.system_version_id, 'adoption_type', a2.adoption_type, 'reason', a2.reason, 'sequence_no', a2.sequence_no),
       a2.occurred_at, COALESCE(a2.recorded_by, 'user'), 'backfill'
FROM public.version_adoptions a2
WHERE a2.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.audit_logs a WHERE a.entity_table = 'version_adoptions' AND a.entity_id = a2.id);
