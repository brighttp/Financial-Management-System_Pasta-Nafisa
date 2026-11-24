-- Requires 202611200001_owner_pegawai_access.sql. Based on server-created timestamp, not editable transaction_date.
BEGIN;
DROP POLICY IF EXISTS app_select_restrictive ON public.financial_transactions;
CREATE POLICY app_select_restrictive ON public.financial_transactions AS RESTRICTIVE FOR SELECT TO PUBLIC
USING (
  public.app_business_role(business_id) = 'owner'
  OR (
    public.app_business_role(business_id) = 'pegawai'
    AND created_by = (SELECT auth.uid())
    AND created_at >= (date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta')
    AND created_at < ((date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') + interval '1 day') AT TIME ZONE 'Asia/Jakarta')
  )
);
DROP POLICY IF EXISTS app_select_permissive ON public.financial_transactions;
CREATE POLICY app_select_permissive ON public.financial_transactions AS PERMISSIVE FOR SELECT TO authenticated
USING (
  public.app_business_role(business_id) = 'owner'
  OR (
    public.app_business_role(business_id) = 'pegawai'
    AND created_by = (SELECT auth.uid())
    AND created_at >= (date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta')
    AND created_at < ((date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') + interval '1 day') AT TIME ZONE 'Asia/Jakarta')
  )
);
COMMIT;
